import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import Files from '$src/infra/files/plugin';
import { minio } from '$src/infra/s3';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(Files, {
    minio: minio,
    bucketName: 'product-images',
    prefix: '/product-images',
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'inbound-images',
    prefix: '/inbound-images',
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
};

export default plugin;
