import assert from 'assert';
import { FastifyPluginAsync, FastifySchema } from 'fastify';
import Imgproxy from 'imgproxy';
import { Readable } from 'stream';

export interface Options {
  bucketName: string;
  schema?: {
    security?: FastifySchema['security'];
  };
}

const plugin: FastifyPluginAsync<Options> = async (
  app,
  { bucketName, schema = {} },
) => {
  const baseUrl = process.env.IMGPROXY_ENDPOINT;
  let imgProxy: Imgproxy | null = null;

  if (baseUrl) {
    imgProxy = new Imgproxy({
      baseUrl,
      encode: true,
    });
  } else {
    app.log.warn('image proxy plugin is disabled. no IMGPROXY_ENDPOINT env');
  }

  app.route({
    method: 'GET',
    url: '/:filename',
    schema: {
      security: schema.security,
      params: {
        filename: {
          type: 'string',
          description: 'name of file',
        },
      },
      querystring: {
        thumbnail: {
          type: 'boolean',
          default: false,
        },
      },
    },
    async handler(req, rep) {
      const { filename } = req.params as {
        filename: string;
      };

      const { thumbnail } = req.query as {
        thumbnail?: boolean;
      };

      assert(imgProxy, 'this endpoint is disabled duo config');

      const urlBuilder = imgProxy.builder().width(400).format('webp');

      if (thumbnail) {
        urlBuilder.blur(20);
      }

      const url = urlBuilder.generateUrl(`/${bucketName}/${filename}`);

      // TODO(erfan): fix Response type
      const response = (await fetch(url)) as any;

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`imgproxy: ${message}`);
      }

      assert(response.body);

      rep.headers(Object.fromEntries(response.headers.entries()));
      return Readable.fromWeb(response.body);
    },
  });
};

export default plugin;
