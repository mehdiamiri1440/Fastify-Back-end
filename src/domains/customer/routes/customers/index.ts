import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { toTypeOrmFilter } from '$src/infra/tables/filter';
import { toUpperCase } from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { validateCustomerData } from '../../utils';

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

      if (emailOrPhone) {
        qb.andWhere(
          `(contact.email || ' ' || contact.phone_number)  like :emailOrPhone`,
          { emailOrPhone: emailOrPhone.$like },
        );
      }

      if (fiscalIdOrAddress) {
        qb.andWhere(
          `(customer.fiscal_id || ' ' || (customer.address ->> 'formatted'))  like :fiscalIdOrAddress`,
          {
            fiscalIdOrAddress: fiscalIdOrAddress.$like,
          },
        );
      }

      if (id) {
        qb.andWhere(`customer.id::varchar(255) like :id`, {
          id: id.$like,
        });
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
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::create'],
        },
      ],
      body: Type.Omit(CustomerSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      const {
        nationalityId,
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
        ...restBody
      } = req.body;

      const nationality = await Nationalities.findOneByOrFail({
        id: nationalityId,
      });

      validateCustomerData({
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
      });

      return await Customers.save({
        ...restBody,
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
        nationality,
        creator: { id: req.user.id },
      });
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
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Customers.findOneByOrFail({ id: req.params.id });
      await Customers.delete({ id });
    },
  });
  await app.register(import('./specification'));
  await app.register(import('./documents'));
  await app.register(import('./contacts'));
  await app.register(import('./address'));
  await app.register(import('./bank'));
};

export default plugin;
