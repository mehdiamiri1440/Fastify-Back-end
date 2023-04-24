import AppDataSource from '$src/DataSource';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../product/models/Product';
import { Supplier } from '../supplier/models/Supplier';
import { Inbound, InboundType } from './models/Inbound';
import { InboundProduct } from './models/InboundProduct';

const Inbounds = repo(Inbound);
const Products = repo(Product);
const Suppliers = repo(Supplier);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['code'],
        orderable: ['code'],
        searchable: ['code'],
      }),
      security: [
        {
          OAuth2: ['user@inbound::list'],
        },
      ],
    },
    handler(req) {
      return new TableQueryBuilder(Inbounds, req).exec();
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      body: Type.Object({
        type: Type.Enum(InboundType),
        products: Type.Array(
          Type.Object({
            productId: Type.Number(),
            supplierId: Type.Number(), // todo amake nullable
            basePrice: Type.Number(),
            quantity: Type.Number(),
          }),
        ),
        driverId: Type.Number(), // nullable
      }),
      security: [
        {
          OAuth2: ['user@inbound::create'],
        },
      ],
    },
    async handler(req) {
      const { type, products } = req.body;
      const { user } = req;

      await AppDataSource.transaction(async (manager) => {
        const inbound = await manager.getRepository(Inbound).save({
          code: '',
          type,
          creator: { id: user.id },
        });

        // Add each product to the inbound record
        for (const productData of products) {
          const { productId, supplierId, basePrice, quantity } = productData;

          const product = await Products.findOneBy({ id: productId });
          if (!product) {
            throw new Error(`Product with id ${productId} not found`);
          }

          const supplier = await Suppliers.findOneBy({ id: supplierId });
          if (!supplier) {
            throw new Error(`Supplier with id ${supplierId} not found`);
          }

          await manager.getRepository(InboundProduct).save({
            inbound,
            product,
            supplier,
            price: basePrice,
            quantity,
            creator: { id: user.id },
          });
        }

        // Return the created inbound record
        return inbound;
      });
    },
  });
};

export default plugin;
