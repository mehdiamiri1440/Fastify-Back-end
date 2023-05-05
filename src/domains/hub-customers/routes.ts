import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import assert from 'assert';

const { HUB_API_ADDRESS, HUB_TOKEN } = process.env;

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/hub-customers',
    schema: {
      querystring: Type.Object({
        name: Type.String(),
      }),
    },
    async handler(req) {
      assert(HUB_API_ADDRESS);
      assert(HUB_TOKEN);
      const { name } = req.query;
      const result = await fetch(
        `${HUB_API_ADDRESS}/gf-clients?size=10&include=true&filter=filter%5Bname%5D%5Blike%5D%3D%25${encodeURI(
          name,
        )}%25&order=order%5BcreationDate%5D%3Ddesc`,
        {
          method: 'GET',
          headers: new Headers({
            Authorization: HUB_TOKEN,
          }),
        },
      );
      return await result.json();
    },
  });
};

export default plugin;
