import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import IbanValidator from '$src/infra/ibanValidator';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/iban/validate/:iban',
    schema: {
      params: Type.Object({
        iban: Type.String(),
      }),
    },
    async handler(req) {
      return IbanValidator(req.params.iban);
    },
  });
};

export default plugin;
