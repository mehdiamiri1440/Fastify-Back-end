import { usersAuth } from '$src/authentication/users';
import { repo } from '$src/databases/typeorm';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import contentDisposition from 'content-disposition';
import { Repository } from 'typeorm';
import { DocumentBuilder } from './Builder';
import { InboundDocument } from './documents/Inbound';
import { Document } from './models/Document';
import createError from '@fastify/error';

const Documents = repo(Document);

const tags = ['Document'];

const TypeBuilderMap: Record<
  Document['type'],
  { new (repo: Repository<Document>, document: Document): DocumentBuilder }
> = {
  inbound: InboundDocument,
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
  app.route({
    method: 'GET',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          Bearer: [],
        },
      ],
    },
    url: '/:id/pdf',
    onRequest: usersAuth,

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

  app.route({
    method: 'GET',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          Bearer: [],
        },
      ],
    },
    url: '/:id/thumbnail',
    onRequest: usersAuth,

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

  app.route({
    method: 'GET',
    schema: {
      tags,
      params: Type.Object({
        id: Type.Number(),
        imageId: Type.Number({ minimum: 1 }),
      }),
      security: [
        {
          Bearer: [],
        },
      ],
    },
    url: '/:id/images/:imageId',
    onRequest: usersAuth,

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
