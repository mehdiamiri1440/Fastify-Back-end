import { parse } from '@danielsoheil/csv-parse-typebox';
import { DeepPartial } from 'typeorm';
import Uploaded from '$src/domains/importer/services/uploaded';
import { Static, Type } from '@sinclair/typebox';
import { repo } from '$src/infra/utils/repo';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { validateCustomerData } from '$src/domains/customer/utils';
import Ajv from 'ajv';
import { NOT_VALID } from '$src/domains/importer/errors';
const ajv = new Ajv({ coerceTypes: true });

const Customers = repo(Customer);
const Nationalities = repo(Nationality);

const UploadedCustomerSchema = Type.Pick(CustomerSchema, [
  'name',
  'contactName',
  'subscriberType',
  'documentType',
  'contactDocumentType',
  'fiscalId',
  'contactFiscalId',
  'contactFamily1',
  'contactFamily2',
  'nationalityId',
  'isActive',
]);

const UploadedCustomerValidator = ajv.compile<typeof UploadedCustomerSchema>(
  UploadedCustomerSchema,
);

export class CustomerUploaded extends Uploaded {
  async parse(): Promise<DeepPartial<Customer>[]> {
    try {
      const customers = await parse(
        await this.getBuffer(),
        UploadedCustomerSchema,
        UploadedCustomerValidator,
      );

      // if one customer have problem we don't want to insert any customer at all
      const customersToSave: DeepPartial<Customer>[] = [];
      for (const customer of customers) {
        // check if subscriber type need business data, business data exist else business data must not exist
        validateCustomerData(customer);

        customersToSave.push({
          ...customer,
          nationality: await Nationalities.findOneByOrFail({
            id: customer.nationalityId,
          }),
          creator: { id: this.userId },
        });
      }
      return customersToSave;
    } catch (e: any) {
      throw e.message.includes('cannot validate') ? new NOT_VALID() : e;
    }
  }
  async insert() {
    return await Customers.insert(await this.parse());
  }
}

export function customerTemplate() {
  const columns = Object.keys(UploadedCustomerSchema.properties);
  return columns.join(',');
}
