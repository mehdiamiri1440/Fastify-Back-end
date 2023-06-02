import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import contentDisposition from 'content-disposition';
import { Repository } from 'typeorm';
import { DocumentBuilder } from './Builder';
import { InboundDocument } from './documents/Inbound';
import { Document } from './models/Document';
import createError from '@fastify/error';
import { OutboundDocument } from './documents/Outbound';

const Documents = repo(Document);

const tags = ['Document'];

const TypeBuilderMap: Record<
  Document['type'],
  { new (repo: Repository<Document>, document: Document): DocumentBuilder }
> = {
  inbound: InboundDocument,
  outbound: OutboundDocument,
};

async function getBuilder(docId: number) {
  const document = await Documents.findOneOrFail({
    where: {
      id: docId,
    },
  });

  const DocumentBuilder = TypeBuilderMap[document.type];
  const builder = new DocumentBuilder(Documents, document);
  return builder;
}

const IMAGE_NOT_FOUND = createError('IMAGE_NOT_FOUND', 'Image not found', 404);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  // GET /:id/pdf
  app.route({
    method: 'GET',
    url: '/:id/pdf',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: [],
        },
      ],
    },
    async handler(req, reply) {
      const { id } = req.params;
      const builder = await getBuilder(id);
      await builder.load();

      const filename = builder.getPdfName();
      const { pdf } = await builder.getBundled({ verifyCache: true });

      return reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          contentDisposition(filename, { type: 'attachment' }),
        )
        .header('Content-Length', pdf.length)
        .send(pdf);
    },
  });

  // GET /:id/html
  app.route({
    method: 'GET',
    url: '/:id/html',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
      }),
      // security: [
      //   {
      //     OAuth2: [],
      //   },
      // ],
    },
    async handler(req, reply) {
      const { id } = req.params;
      const builder = await getBuilder(id);
      await builder.load();
      const html = builder.getHtml();

      return reply
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(html);
    },
  });

  // GET /:id/thumbnail
  app.route({
    method: 'GET',
    url: '/:id/thumbnail',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: [],
        },
      ],
    },

    async handler(req, reply) {
      const { id } = req.params;
      const builder = await getBuilder(id);
      await builder.load();

      const { thumb } = await builder.getBundled({ verifyCache: false });

      return reply
        .header('Content-Type', 'image/webp')
        .header('Content-Length', thumb.length)
        .send(thumb);
    },
  });

  // GET /:id/images/:imageId
  app.route({
    method: 'GET',
    url: '/:id/images/:imageId',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
        imageId: Type.Number({ minimum: 1 }),
      }),
      security: [
        {
          OAuth2: [],
        },
      ],
    },

    async handler(req, reply) {
      const { id, imageId } = req.params;
      const builder = await getBuilder(id);
      await builder.load();

      const { images } = await builder.getBundled({ verifyCache: true });

      const image = images[imageId - 1];
      if (!image) throw new IMAGE_NOT_FOUND();

      return reply
        .header('Content-Type', 'image/webp')
        .header('Content-Length', image.length)
        .send(image);
    },
  });
};

export default plugin;
