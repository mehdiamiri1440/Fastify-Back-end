import { parse } from '@danielsoheil/csv-parse-typebox';
import { DeepPartial } from 'typeorm';
import Uploaded from '$src/domains/importer/services/uploaded';
import { Static, Type } from '@sinclair/typebox';
import { repo } from '$src/infra/utils/repo';
import { ProductSchema } from '$src/domains/product/schemas/product.schema';
import { Product } from '$src/domains/product/models/Product';
import Ajv from 'ajv';
const ajv = new Ajv({ coerceTypes: true });

const Products = repo(Product);

const UploadedProductSchema = Type.Pick(ProductSchema, [
  'name',
  'barcode',
  'invoiceSystemCode',
  'description',
  'weight',
  'content',
]);

const UploadedProductValidator = ajv.compile<typeof UploadedProductSchema>(
  UploadedProductSchema,
);

export class ProductUploaded extends Uploaded {
  async parse(): Promise<DeepPartial<Product>[]> {
    const products = await parse(
      await this.getBuffer(),
      UploadedProductSchema,
      UploadedProductValidator,
    );

    // if one product have problem we don't want to insert any product at all
    const productsToSave: DeepPartial<Product>[] = [];
    for (const product of products) {
      productsToSave.push({
        ...product,
        creator: { id: this.userId },
      });
    }
    return productsToSave;
  }
  async insert() {
    return await Products.insert(await this.parse());
  }
}

export function productTemplate() {
  const columns = Object.keys(UploadedProductSchema.properties);
  return columns.join(',');
}
