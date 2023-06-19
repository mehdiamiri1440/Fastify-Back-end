import { SupplierSchema } from '$src/domains/supplier/schemas/supplier.schema';
import { ResponseShape } from '$src/infra/Response';
import ibanValidator from '$src/infra/ibanValidator';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Language } from '../../models/Language';
import { Supplier } from '../../models/Supplier';
import { toTypeOrmFilter } from '$src/infra/tables/filter';
import { toUpperCase } from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { ProductSupplier } from '$src/domains/product/models/ProductSupplier';
import { SUPPLIER_SUPPLYING_OUR_PRODUCT } from '$src/domains/supplier/errors';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Suppliers = repo(Supplier);
  const Languages = repo(Language);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'name', 'cif']),
        filter: Filter({
          name: Searchable(),
          cif: Searchable(),
          phoneOrEmailOrName: Searchable(),
        }),
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;
      const { phoneOrEmailOrName, ...normalFilters } = filter ?? {};

      const qb = Suppliers.createQueryBuilder('supplier')
        .leftJoinAndSelect('supplier.creator', 'creator')
        .where(toTypeOrmFilter(normalFilters));

      if (phoneOrEmailOrName) {
        qb.andWhere(
          `CONCAT(supplier.email, ' ', supplier.phone_number, supplier.name) ilike :phoneOrEmailOrName`,
          { phoneOrEmailOrName: phoneOrEmailOrName.$like },
        );
      }

      const [rows, total] = await qb
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(`supplier.${orderBy}`, toUpperCase(order))
        .getManyAndCount();

      return new PaginatedResponse(rows, {
        page: page,
        pageSize: pageSize,
        total,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['supplier@supplier::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return Suppliers.findOneOrFail({
        where: {
          id,
        },
        relations: {
          creator: true,
          language: true,
        },
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::create'],
        },
      ],
      body: Type.Pick(SupplierSchema, [
        'name',
        'cif',
        'language',
        'iban',
        'email',
        'phoneNumber',
        'logoFileId',
        'accountNumber',
      ]),
    },
    async handler(req) {
      // validating references
      const language = await Languages.findOneByOrFail({
        id: req.body.language,
      });

      // validating iban
      const { bic, bankName } = await ibanValidator(req.body.iban);

      return await Suppliers.save({
        ...req.body,
        bic,
        bankName,
        language,
        creator: { id: req.user.id },
      });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      body: Type.Pick(SupplierSchema, [
        'name',
        'cif',
        'language',
        'iban',
        'email',
        'phoneNumber',
        'logoFileId',
        'accountNumber',
      ]),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      // validating references
      const language = await Languages.findOneByOrFail({
        id: req.body.language,
      });

      // validating iban
      const { bic, bankName } = await ibanValidator(req.body.iban);

      const { id } = await Suppliers.findOneByOrFail({ id: req.params.id });
      const newData = { ...req.body, bic, bankName, language };
      await Suppliers.update({ id }, newData);
      return newData;
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      if (
        (await repo(ProductSupplier).countBy({
          supplier: { id: supplier.id },
        })) > 0
      )
        throw new SUPPLIER_SUPPLYING_OUR_PRODUCT();

      await Suppliers.softRemove(supplier);
    },
  });

  await app.register(import('./contacts'));
  await app.register(import('./documents'));
  await app.register(import('./products'));
};

export default plugin;
