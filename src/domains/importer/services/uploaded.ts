import assert from 'assert';
import { minio } from '$src/infra/s3';
import consumers from 'stream/consumers';

class Uploaded {
  userId: number;
  fileId: string;

  constructor(userId: number, fileId: string) {
    this.userId = userId;
    this.fileId = fileId;
  }

  async getBuffer() {
    assert(minio, 'Storage is not enable. missing env');

    // read file from bucket
    const readable = await minio.getObject('importer', this.fileId);
    return await consumers.buffer(readable);
  }
}

export default Uploaded;
