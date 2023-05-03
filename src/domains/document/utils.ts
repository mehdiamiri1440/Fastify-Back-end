import { minio } from '$src/infra/s3';
import assert from 'assert';
import { Readable } from 'stream';

const signatureBucketName = 'signatures';
export const loadSignature = async (fileId: string) => {
  assert(minio, 'document s3 client is not initialized');

  try {
    const readable = await minio.getObject(signatureBucketName, fileId);
    const data = await readAll(readable);
    return Buffer.from(data);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'NoSuchKey'
    ) {
      // the object doesn't exist in the S3 bucket
      return null;
    }
    throw error;
  }
};

async function readAll(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Concatenate all the chunks into a single Uint8Array
  const result = new Uint8Array(Buffer.concat(chunks));
  return result;
}

const formatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (date: Date | null | undefined) =>
  date ? formatter.format(date) : '';
