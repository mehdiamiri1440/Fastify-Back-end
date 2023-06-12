import AppDataSource from '$src/DataSource';
import { Customer } from '$src/domains/customer/models/Customer';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { User } from '$src/domains/user/models/User';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { Nullable } from '$src/infra/utils/Nullable';
import StringEnum from '$src/infra/utils/StringEnum';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { loadReceiver, validateReceiver } from '../Receiver';
import { INVALID_STATUS } from '../errors';
import { Outbound, OutboundStatus, ReceiverType } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';
import { OutboundService } from '../services/outbound.service';
import { loadUserWarehouse } from '../utils';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const outboundsRepo = repo(Outbound);
  const outboundProductsRepo = repo(OutboundProduct);
  const usersRepo = repo(User);

  app.register(ResponseShape);

  app.get('/', {
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['code', 'status', 'creator.fullName', 'createdAt']),
        filter: Filter({
          status: StringEnum(Object.values(OutboundStatus)),
          code: Searchable(),
          creator: Type.Object({
            fullName: Searchable(),
          }),
        }),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const userWarehouse = await loadUserWarehouse(req.user.id);

      return new TableQueryBuilder(outboundsRepo, req)
        .relation({
          creator: true,
          warehouse: true,
        })
        .where(
          where.merge([
            where.from(req),
            {
              warehouse: { id: userWarehouse.id },
            },
          ]),
        )
        .loadRelationIds(false)
        .exec();
    },
  });

  app.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneOrFail({
        where: {
          id,
        },
        relations: {
          creator: true,
          driver: true,
        },
        loadRelationIds: false,
      });

      return {
        ...outbound,
        receiver: await loadReceiver(outbound),
      };
    },
  });

  app.get('/:id/products', {
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;

      const outbound = await outboundsRepo.findOneOrFail({
        where: { id },
        loadRelationIds: {
          disableMixedMap: true,
        },
      });

      const { raw, entities } = await outboundProductsRepo
        .createQueryBuilder('outbound_product')
        .addSelect('product_quantity.quantity', 'availableQuantity')
        .where({
          outbound: {
            id,
          },
        })
        .leftJoinAndMapOne(
          'product_quantity.quantity',
          (qb) =>
            qb
              .select('bin_product.product_id')
              .from(BinProduct, 'bin_product')
              .addSelect('SUM(bin_product.quantity)', 'quantity')
              .leftJoin('bin_product.bin', 'bin')
              .andWhere('bin.warehouse_id = :warehouseId', {
                warehouseId: outbound.warehouse.id,
              })
              .groupBy('bin_product.product_id'),

          'product_quantity',
          'product_quantity.product_id = outbound_product.product_id',
        )
        .leftJoinAndSelect('outbound_product.product', 'product')
        .leftJoinAndSelect('product.unit', 'unit')
        .getRawAndEntities();

      return entities.map((entity, index) => ({
        ...entity,
        availableQuantity: Number(raw[index].availableQuantity),
      }));
    },
  });

  app.post('/', {
    schema: {
      security: [
        {
          OAuth2: ['outbound@outbound::create'],
        },
      ],
      body: Type.Object({
        products: Type.Array(
          Type.Object({
            productId: Type.Integer(),
            quantity: Type.Integer(),
          }),
        ),
      }),
    },

    handler: async (request) => {
      const { body, user } = request;
      const warehouse = await loadUserWarehouse(user.id);

      const outbound = await AppDataSource.transaction(async (manager) => {
        const outboundService = new OutboundService(manager, user.id);

        const outbound = await outboundService.create({
          warehouse,
        });

        for (const item of body.products) {
          await outboundService.addProduct(outbound, item.productId, {
            quantity: item.quantity,
          });
        }

        return outbound;
      });

      return outbound;
    },
  });

  app.delete('/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::decline'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new INVALID_STATUS(`only draft outbounds can be deleted`);
      }

      await outboundsRepo.softDelete(id);
      return outboundsRepo.findOneOrFail({ where: { id }, withDeleted: true });
    },
  });

  app.post('/:id/set-receiver', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Union([
        Type.Object({
          receiverType: StringEnum(Object.values(ReceiverType)),
          receiverId: Type.Integer(),
        }),
        Type.Object({
          receiverType: Type.Null(),
          receiverId: Type.Null(),
        }),
      ]),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { receiverType, receiverId } = req.body;

      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new INVALID_STATUS(
          `you can only set a customer for a draft outbound`,
        );
      }

      if (!receiverType && !receiverId) {
        outbound.receiverId = null;
        outbound.receiverType = null;
        await outboundsRepo.save(outbound);
        return outbound;
      }

      await validateReceiver({ receiverId, receiverType });

      outbound.receiverId = receiverId;
      outbound.receiverType = receiverType;
      await outboundsRepo.save(outbound);
      return {
        ...outbound,
        receiver: await loadReceiver(outbound),
      };
    },
  });

  app.post('/:id/confirm-current-step', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { user } = req;
      const { id } = req.params;
      const service = new OutboundService(AppDataSource, user.id);

      const outbound = await outboundsRepo.findOneOrFail({
        where: { id },
        relations: {
          driver: true,
        },
      });

      await service.confirmStep(outbound);

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  /**
   * This route this receive a driverId or null.
   * if current state of outbound is `Transfer`, then it will change the state of outbound to `Picking`
   * else if user wants to remove the driverId, we will transfer the state back `Transfer`
   */
  app.post('/:id/set-driver', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        driverId: Nullable(Type.Integer()),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { driverId } = req.body;

      const outbound = await outboundsRepo.findOneByOrFail({ id });
      const allowedStates = [OutboundStatus.TRANSFER, OutboundStatus.PICKING];
      if (!allowedStates.includes(outbound.status)) {
        throw new INVALID_STATUS('outbound state is not TRANSFER or PICKING');
      }

      const driver = driverId
        ? await usersRepo.findOneByOrFail({ id: driverId })
        : null;

      await outboundsRepo.update(outbound.id, {
        driver,
      });

      return outboundsRepo.findOneOrFail({
        where: { id },
        relations: {
          driver: true,
        },
      });
    },
  });

  app.post('/:id/set-creator-signature', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;

      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        creatorSignature: signature,
      });
    },
  });

  app.post('/:id/set-customer-signature', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        customerSignature: signature,
      });
    },
  });

  app.post('/:id/set-driver-signature', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        driverSignature: signature,
      });
    },
  });
};

export default plugin;
