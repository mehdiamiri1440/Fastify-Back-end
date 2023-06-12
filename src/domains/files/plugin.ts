import { FastifySchema } from 'fastify';
import createError from '@fastify/error';
import { randomUUID } from 'crypto';
import { lookup, extension } from 'mime-types';
import contentDisposition from 'content-disposition';
import { to } from 'await-to-js';
import type { Client } from 'minio';
import assert from 'assert';
import { repo } from '$src/infra/utils/repo';
import { File } from './models/File';
import {
  FastifyPluginAsyncTypebox,
  Type,
} from '@fastify/type-provider-typebox';

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

const plugin: FastifyPluginAsyncTypebox<Options> = async (
  app,
  { minio, bucketName, schema = {}, maxUploadSize, allowedMimeTypes },
) => {
  const filesRepo = repo(File);

  const description = () =>
    [
      '#### Allowed Mime Types',
      ...(allowedMimeTypes?.map((t) => `- ${t}`) ?? '- any mime type'),
      '#### Max Upload Size',
      `${maxUploadSize ? `${maxUploadSize / 1024 / 1024}MB` : 'unlimited'}`,
    ].join('\n');

  app.route({
    method: 'GET',
    url: '/:id',

    schema: {
      security: schema.security,
      params: Type.Object({
        id: Type.String(),
      }),
    },
    async handler(req, rep) {
      assert(minio, 'Storage is not enable. missing env');
      const { id } = req.params;
      const [err, readable] = await to(minio.getObject(bucketName, id));

      if (err) {
        if ('code' in err && err.code === 'NoSuchKey') {
          throw new FILE_NOT_FOUND();
        }

        throw err;
      }

      const fileMetadata = await filesRepo.findOneBy({
        id,
        bucketName,
      });

      const filename = fileMetadata?.originalName ?? id;

      rep
        .type(lookup(id) || 'application/octet-stream')
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
      description: description(),
      body: Type.Object({
        file: Type.String({ format: 'binary' }),
      }),
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

      const data = await file.toBuffer();
      const filename = `${randomUUID()}.${extension(file.mimetype)}`;

      await minio.putObject(bucketName, filename, data);

      await filesRepo.save({
        id: filename,
        bucketName,
        mimetype: file.mimetype,
        size: data.length,
        originalName: file.filename,
        creator: req.user?.id ? { id: req.user.id } : null,
      });

      return { filename };
    },
  });
};

export default plugin;
