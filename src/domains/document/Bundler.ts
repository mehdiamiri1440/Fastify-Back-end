import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { htmlToPdf } from './pdf2_client';

export interface DocumentBundle {
  cacheKey: string;
  pdf: Uint8Array;
  pdfName: string;
  pages: number;
  thumb: Uint8Array;
  images: Uint8Array[];
}

const md5 = (v: Buffer | string) => createHash('md5').update(v).digest('hex');

export class Bundler {
  converter = htmlToPdf;
  cache = true;

  #pngImagesToWebp(images: Buffer[]) {
    return Promise.all(
      images.map((image) => sharp(image).toFormat('webp').toBuffer()),
    );
  }

  #imageToThumb(image: Buffer) {
    return sharp(image)
      .resize({
        width: 250,
        fit: sharp.fit.outside,
      })
      .toFormat('webp')
      .toBuffer();
  }

  async fromHtml(html: string, pdfName: string): Promise<DocumentBundle> {
    const { pdf, images, pages } = await this.converter(html);

    return {
      cacheKey: this.getCacheKey(html),
      pdfName,
      pages,
      images: await this.#pngImagesToWebp(images),
      thumb: await this.#imageToThumb(images[0]),
      pdf,
    };
  }

  getCacheKey(html: string): string {
    return md5(html);
  }
}
