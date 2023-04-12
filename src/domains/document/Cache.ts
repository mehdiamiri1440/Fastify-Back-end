import { minio } from '$src/infra/s3';
import { BSON, Binary } from 'bson';
import assert from 'node:assert';
import { Readable } from 'stream';
import { DocumentBundle } from './Bundler';

// this interface should be private
interface DocumentBson {
  cacheKey: string;
  pdf: Binary;
  pdfName: string;
  pages: number;
  thumb: Binary;
  images: Binary[];
}

async function readAll(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Concatenate all the chunks into a single Uint8Array
  const result = new Uint8Array(Buffer.concat(chunks));
  return result;
}

function toBson({ thumb, pdf, images, ...rest }: DocumentBundle): DocumentBson {
  return {
    ...rest,
    pdf: new Binary(pdf),
    thumb: new Binary(thumb),
    images: images.map((e) => new Binary(e)),
  };
}

function fromBson({
  thumb,
  pdf,
  images,
  ...rest
}: DocumentBson): DocumentBundle {
  return {
    ...rest,
    pdf: pdf.buffer,
    thumb: thumb.buffer,
    images: images.map((e) => e.buffer),
  };
}

export class Cache {
  client = minio;
  bucketName = 'document-cache';
  #id: string;

  constructor(id: string) {
    this.#id = id;
  }

  async save(pack: DocumentBundle): Promise<void> {
    assert(this.client, 'document s3 client is not initialized');
    const buffer = BSON.serialize(toBson(pack));
    await this.client.putObject(
      this.bucketName,
      `${this.#id}.bson`,
      Buffer.from(buffer),
    );
  }

  async #readFromS3(): Promise<DocumentBundle | null> {
    assert(this.client, 'document s3 client is not initialized');

    try {
      const readable = await this.client.getObject(
        this.bucketName,
        `${this.#id}.bson`,
      );
      const data = await readAll(readable);
      const document = BSON.deserialize(data) as DocumentBson;
      return fromBson(document);
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        // the object doesn't exist in the S3 bucket
        return null;
      }
      throw error;
    }
  }

  /**
   *
   * @param cacheKey pass this parameter to enforce the result to be a valid cache.
   * if not passed, the latest cache for this document will be returned
   */
  async get(cacheKey?: string): Promise<DocumentBundle | null> {
    const document = await this.#readFromS3();
    if (!document) {
      // cache not found, nothing to verify
      return null;
    }

    if (!cacheKey) return document;

    if (document.cacheKey !== cacheKey) {
      // cache key doesn't match, delete the cache and return null
      await this.deleteBsonDocument();
      return null;
    }
    return document;
  }

  async deleteBsonDocument(): Promise<void> {
    assert(this.client, 'document s3 client is not initialized');
    await this.client.removeObject(this.bucketName, `${this.#id}.bson`);
  }
}
