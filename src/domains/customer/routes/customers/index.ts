import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Range,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { toTypeOrmFilter } from '$src/infra/tables/filter';
import { toUpperCase } from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { validateCustomerData } from '../../utils';
import {
  NEED_BUSINESS_DATA,
  NOT_NEED_BUSINESS_DATA,
} from '$src/domains/customer/errors';

const Customers = repo(Customer);
const Nationalities = repo(Nationality);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.get('/', {
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::list'],
        },
      ],

      querystring: PaginatedQueryString({
        orderBy: OrderBy([
          'id',
          'name',
          'fiscalId',
          'email',
          'createdAt',
          'isActive',
        ]),
        filter: Filter({
          id: Searchable(),
          isActive: Type.Boolean(),
          name: Searchable(),
          emailOrPhone: Searchable(),
          fiscalIdOrAddress: Searchable(),
          createdAt: Range(Type.String({ format: 'date-time' })),
        }),
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;

      const { id, emailOrPhone, fiscalIdOrAddress, ...normalFilters } =
        filter ?? {};

      const qb = Customers.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.contacts', 'contact')
        .leftJoinAndSelect('customer.nationality', 'nationality')
        .where(toTypeOrmFilter(normalFilters));

      if (id) {
        qb.andWhere(`customer.id::varchar(255) ilike :id`, {
          id: id.$like,
        });
      }

      if (emailOrPhone) {
        qb.andWhere(
          `CONCAT(contact.email, ' ', contact.phone_number) ilike :emailOrPhone`,
          { emailOrPhone: emailOrPhone.$like },
        );
      }

      if (fiscalIdOrAddress) {
        qb.andWhere(
          `CONCAT(customer.fiscal_id, ' ', (customer.address ->> 'formatted')) ilike :fiscalIdOrAddress`,
          {
            fiscalIdOrAddress: fiscalIdOrAddress.$like,
          },
        );
      }

      const [rows, total] = await qb
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(`customer.${orderBy}`, toUpperCase(order))
        .getManyAndCount();

      return new PaginatedResponse(rows, {
        page: page,
        pageSize: pageSize,
        total,
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    config: {
      possibleErrors: [NEED_BUSINESS_DATA, NOT_NEED_BUSINESS_DATA],
    },
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::create'],
        },
      ],
      body: Type.Pick(CustomerSchema, [
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
        'birthday',
        'isActive',
      ]),
    },
    async handler(req) {
      const {
        nationalityId,
        contactName,
        contactFiscalId,
        contactDocumentType,
        subscriberType,
        ...restBody
      } = req.body;

      const nationality = await Nationalities.findOneByOrFail({
        id: nationalityId,
      });

      validateCustomerData({
        contactName,
        contactFiscalId,
        contactDocumentType,
        subscriberType,
      });

      const { id } = await Customers.save({
        ...restBody,
        contactName,
        contactFiscalId,
        contactDocumentType,
        subscriberType,
        nationality,
        creator: { id: req.user.id },
      });

      // we should load the customer again to get the generated code
      return Customers.findOneOrFail({
        where: { id },
        relations: {
          nationality: true,
          creator: true,
        },
      });
    },
  });

  app.put('/:id/is-active', {
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Pick(CustomerSchema, ['isActive']),
    },
    async handler(req) {
      const { id } = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      await Customers.update({ id }, req.body);
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const customer = await Customers.findOneByOrFail({ id: req.params.id });
      await Customers.softRemove(customer);
    },
  });
  await app.register(import('./specification'));
  await app.register(import('./documents'));
  await app.register(import('./contacts'));
  await app.register(import('./address'));
  await app.register(import('./bank'));
};

export default plugin;
