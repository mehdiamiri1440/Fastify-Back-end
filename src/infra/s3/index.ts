import { Client } from 'minio';
import createError from '@fastify/error';
import pino from 'pino';

const logger = pino({
  name: 's3',
});

const { S3_URI } = process.env;

const COULD_NOT_INIT_STORAGE = createError(
  'COULD_NOT_INIT_STORAGE',
  'could not init storage',
  500,
);

export let minio: Client | null = null;

if (S3_URI) {
  const s3Uri = new URL(S3_URI);

  minio = new Client({
    endPoint: s3Uri.hostname,
    port: s3Uri.port ? Number(s3Uri.port) : 9000,
    useSSL: s3Uri.protocol.startsWith('https'),
    accessKey: decodeURIComponent(s3Uri.username),
    secretKey: decodeURIComponent(s3Uri.password),
  });
} else {
  logger.warn('S3_URI is not defined');
}

export const getStorage = () => {
  if (!minio) throw new COULD_NOT_INIT_STORAGE();
  return minio;
};
