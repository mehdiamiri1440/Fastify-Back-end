import { ResponseShape } from '$src/infra/Response';
import Docs from '$src/infra/docs';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { QrCodeType, getAsLink, inferCodeType } from './utils';
import { repo } from '$src/infra/utils/repo';
import { Product } from '../product/models/Product';
import { Customer } from '../customer/models/Customer';
import { Inbound } from '../inbound/models/Inbound';
import { Outbound } from '../outbound/models/Outbound';
import * as QrCode from 'qrcode';
import { join } from 'path';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const productsRepo = repo(Product);
  const customersRepo = repo(Customer);
  const inboundsRepo = repo(Inbound);
  const outboundsRepo = repo(Outbound);

  await app.register(Docs, {
    path: join(__dirname, './docs.md'),
  });
  await app.register(ResponseShape);

  app.get('/qr/:code/info', {
    schema: {
      params: Type.Object({
        code: Type.String(),
      }),
    },
    async handler(req) {
      const code = req.params.code.toUpperCase();

      switch (inferCodeType(code)) {
        case QrCodeType.PRODUCT: {
          const product = await productsRepo.findOneByOrFail({ code });
          return {
            type: 'product',
            typeId: product.id,
          };
        }

        case QrCodeType.INBOUND: {
          const inbound = await inboundsRepo.findOneByOrFail({ code });
          return {
            type: 'inbound',
            typeId: inbound.id,
          };
        }

        case QrCodeType.OUTBOUND: {
          const outbound = await outboundsRepo.findOneByOrFail({ code });
          return {
            type: 'outbound',
            typeId: outbound.id,
          };
        }

        case QrCodeType.CUSTOMER: {
          const customer = await customersRepo.findOneByOrFail({ code });
          return {
            type: 'customer',
            typeId: customer.id,
          };
        }
      }
    },
  });

  app.get('/qr/:code/svg', {
    schema: {
      params: Type.Object({
        code: Type.String(),
      }),
    },
    async handler(req, reply) {
      const code = req.params.code.toUpperCase();

      const svg = await QrCode.toString(getAsLink(code), {
        type: 'svg',
      });

      return reply.header('Content-Type', 'image/svg+xml').send(svg);
    },
  });
};

export default plugin;
