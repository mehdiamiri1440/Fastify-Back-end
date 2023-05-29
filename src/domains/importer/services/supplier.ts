import { parse } from '@danielsoheil/csv-parse-typebox';
import { DeepPartial } from 'typeorm';
import Uploaded from '$src/domains/importer/services/uploaded';
import { Static, Type } from '@sinclair/typebox';
import { SupplierSchema } from '$src/domains/supplier/schemas/supplier.schema';
import { repo } from '$src/infra/utils/repo';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Language } from '$src/domains/supplier/models/Language';
import Ajv from 'ajv';
const ajv = new Ajv({ coerceTypes: true });

const Suppliers = repo(Supplier);
const Languages = repo(Language);

const UploadedSupplierSchema = Type.Pick(SupplierSchema, [
  'name',
  'cif',
  'language',
  'iban',
  'email',
  'phoneNumber',
  'accountNumber',
]);
const UploadedSupplierValidator = ajv.compile<typeof UploadedSupplierSchema>(
  UploadedSupplierSchema,
);

export class SupplierUploaded extends Uploaded {
  async parse(): Promise<DeepPartial<Supplier>[]> {
    const suppliers = await parse(
      await this.getBuffer(),
      UploadedSupplierSchema,
      UploadedSupplierValidator,
    );

    // if one supplier have problem we don't want to insert any supplier at all
    const suppliersToSave: DeepPartial<Supplier>[] = [];
    for (const supplier of suppliers) {
      suppliersToSave.push({
        ...supplier,
        language: await Languages.findOneByOrFail({
          id: supplier.language,
        }),
        creator: { id: this.userId },
      });
    }
    return suppliersToSave;
  }
  async insert() {
    return await Suppliers.insert(await this.parse());
  }
}

export function supplierTemplate() {
  const columns = Object.keys(UploadedSupplierSchema.properties);
  return columns.join(',');
}
