import { FastifyPluginAsync, FastifySchema } from 'fastify';
import createError from '@fastify/error';
import fastifyMultipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import mime from 'mime-types';
import contentDisposition from 'content-disposition';
import { to } from 'await-to-js';
import type { Client } from 'minio';
import assert from 'assert';

const FILE_NOT_FOUND = createError('FILE_NOT_FOUND', 'file not found', 404);
const INVALID_FILE = createError('INVALID_FILE', 'invalid file', 400);

export interface Options {
  minio: Client | null;
  bucketName: string;
  schema?: {
    security?: FastifySchema['security'];
  };
}

const plugin: FastifyPluginAsync<Options> = async (
  app,
  { minio, bucketName, schema = {} },
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
        .type(mime.lookup(filename) || 'application/octet-stream')
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
      const file = await req.file();
      if (!file) throw new INVALID_FILE();

      const readable = file.file;
      const filename = `${randomUUID()}.${mime.extension(file.mimetype)}`;

      await minio.putObject(bucketName, filename, readable);

      return { filename };
    },
  });
};

export default plugin;
