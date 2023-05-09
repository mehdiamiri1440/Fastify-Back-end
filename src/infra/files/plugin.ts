import { FastifyPluginAsync, FastifySchema } from 'fastify';
import createError from '@fastify/error';
import fastifyMultipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import { lookup, extension } from 'mime-types';
import contentDisposition from 'content-disposition';
import { to } from 'await-to-js';
import type { Client } from 'minio';
import assert from 'assert';

const FILE_NOT_FOUND = createError('FILE_NOT_FOUND', 'file not found', 404);
const INVALID_FILE = createError('INVALID_FILE', 'invalid file', 400);
const INVALID_MIME_TYPE = createError(
  'INVALID_MIME_TYPE',
  'uploaded mime type is not allowed',
  400,
);

const DEFAULT_FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export interface Options {
  minio: Client | null;
  bucketName: string;
  maxUploadSize?: number;
  allowedMimeTypes?: string[];
  schema?: {
    security?: FastifySchema['security'];
  };
}

const plugin: FastifyPluginAsync<Options> = async (
  app,
  { minio, bucketName, schema = {}, maxUploadSize, allowedMimeTypes },
) => {
  app.register(fastifyMultipart);

  app.route({
    method: 'GET',
    url: '/:filename',

    schema: {
      security: schema.security,
      params: {
        filename: {
          type: 'string',
          description: 'name of file',
        },
      },
    },
    async handler(req, rep) {
      assert(minio, 'Storage is not enable. missing env');
      const { filename } = req.params as {
        filename: string;
      };
      const [err, readable] = await to(minio.getObject(bucketName, filename));

      if (err) {
        if ('code' in err && err.code === 'NoSuchKey') {
          throw new FILE_NOT_FOUND();
        }

        throw err;
      }

      rep
        .type(lookup(filename) || 'application/octet-stream')
        .header(
          'Content-Disposition',
          contentDisposition(filename, { type: 'attachment' }),
        );

      return readable;
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      consumes: ['multipart/form-data'],
      security: schema.security,
      body: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
    // ignore body validation
    validatorCompiler() {
      return function () {
        return true;
      };
    },
    async handler(req) {
      assert(minio, 'Storage is not enable. missing env');
      const file = await req.file({
        limits: {
          files: 1,
          fileSize: maxUploadSize ?? DEFAULT_FILE_SIZE_LIMIT,
        },
      });
      if (!file) throw new INVALID_FILE();

      if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
        throw new INVALID_MIME_TYPE(
          `uploaded mime type is not allowed, only ${allowedMimeTypes.join(
            ',',
          )} allowed`,
        );
      }

      const readable = file.file;
      const filename = `${randomUUID()}.${extension(file.mimetype)}`;

      await minio.putObject(bucketName, filename, readable);

      return { filename };
    },
  });
};

export default plugin;
