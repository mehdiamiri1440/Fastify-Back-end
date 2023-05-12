import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TaxType } from '../models/TaxType';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const TaxTypes = repo(TaxType);

  // GET /tax-types
  app.route({
    method: 'GET',
    url: '/tax-types',
    schema: {},
    async handler() {
      return TaxTypes.find();
    },
  });
};

export default plugin;
