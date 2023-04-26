import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import Files from '$src/infra/files/plugin';
import { minio } from '$src/infra/s3';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(Files, {
    minio: minio,
    bucketName: 'inbound-images',
    prefix: '/inbound-images',
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'inbound-signatures',
    prefix: '/inbound-signatures',
  });

  await app.register(Files, {
    minio: minio,
    bucketName: 'supplier-documents',
    prefix: '/supplier-documents',
  });
};

export default plugin;
