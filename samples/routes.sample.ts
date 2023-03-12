import { ASN } from "../src/domains/inbound/models/Inbound.js";

import { AppDataSource } from "$src/infra/data-source.js";
import * as Filter from "$src/infra/filter.js";
import { ListQueryOptions } from "$src/infra/list-schema-querystring.js";
import * as Order from "$src/infra/order.js";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const AsnRepo = AppDataSource.getRepository(ASN);

const plugin: FastifyPluginAsyncTypebox = async function (fastify, _opts) {
  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      querystring: ListQueryOptions({
        orderable: ["id", "name"],
        filterable: ["name"],
        searchable: ["name"],
      }),
    },
    handler: async (req) => {
      const { page, pageSize } = req.query as any;

      const [entities, total] = await AsnRepo.findAndCount({
        relations: {
          customer: true,
        },
        where: Filter.merge([
          Filter.from(req),
          {
            creator: 11,
          },
        ]),
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: Order.from(req),
      });

      return {
        entities,
        total,
      };
    },
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      body: Type.Object({
        // name length must be between 3 and 255 characters
        name: Type.String({
          minLength: 3,
          maxLength: 255,
          pattern: "^[a-zA-Z0-9 ]+$",
        }),
        customerId: Type.Number(),
      }),
    },
    handler: async (request, reply) => {
      const { name, customerId } = request.body;

      const customer = await AsnRepo.findOneOrFail({
        where: { id: customerId },
      });

      const asn = await AsnRepo.save({
        name,
        customer,
      });

      reply.code(201);
      return asn;
    },
  });
};

export default plugin;
