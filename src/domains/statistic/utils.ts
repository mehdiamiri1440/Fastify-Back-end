import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Customer } from '$src/domains/customer/models/Customer';
import { Inbound } from '$src/domains/inbound/models/Inbound';
import { Outbound } from '$src/domains/outbound/models/Outbound';
import { Product } from '$src/domains/product/models/Product';
import StringEnum from '$src/infra/utils/StringEnum';
import { Static } from '@sinclair/typebox';

export const stringEntitySchema = StringEnum([
  'supplier',
  'customer',
  'inbound',
  'outbound',
  'product',
]);

export const getEntityFromString = (
  stringEntity: Static<typeof stringEntitySchema>,
) => {
  switch (stringEntity) {
    case 'supplier': {
      return Supplier;
    }
    case 'customer': {
      return Customer;
    }
    case 'inbound': {
      return Inbound;
    }
    case 'outbound': {
      return Outbound;
    }
    case 'product': {
      return Product;
    }
  }
};
