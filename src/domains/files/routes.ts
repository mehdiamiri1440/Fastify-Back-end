import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import Files from './plugin';
import { minio } from '$src/infra/s3';
import fastifyMultipart from '@fastify/multipart';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(fastifyMultipart);

  await app.register(Files, {
    minio: minio,
    bucketName: 'product-images',
    prefix: '/product-images',
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'signatures',
    prefix: '/signatures',
    maxUploadSize: 1 * 1024 * 1024,
    allowedMimeTypes: ['image/png'],
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'logos',
    prefix: '/logos',
    maxUploadSize: 1 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'supplier-documents',
    prefix: '/supplier-documents',
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'customer-documents',
    prefix: '/customer-documents',
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'importer',
    prefix: '/importer',
  });
  await app.register(Files, {
    minio: minio,
    bucketName: 'support',
    prefix: '/support',
  });
};

export default plugin;
