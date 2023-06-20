import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { Align, getMarkdownTable } from 'markdown-table-ts';
import { RouteOptions } from 'fastify';
import { FastifyErrorConstructor } from '@fastify/error';

const plugin: FastifyPluginAsyncTypebox<{ path: string }> = async function (
  fastify,
  { path },
) {
  const getErrorsTable = (
    possibleErrors: FastifyErrorConstructor[],
  ): string => {
    if (possibleErrors.length <= 0) return '';

    const tableRows: [string, string, string][] = [];
    for (const error of possibleErrors) {
      const e = new error();
      tableRows.push([String(e.statusCode), e.code, e.message]);
    }

    return (
      '\n\n' +
      '## Possible Errors: \n' +
      getMarkdownTable({
        table: {
          head: ['Status Code', 'Code', 'Description'],
          body: tableRows,
        },
        alignment: [Align.Left, Align.Center, Align.Right],
      }) +
      '\n\n'
    );
  };

  fastify.addHook('onRoute', (route) => {
    if (route.method == 'HEAD') return; // this is for avoiding duplicate errors table
    if (!route.config) return;
    if (!route.config.possibleErrors) return;

    // Tags already defined, do nothing
    if (!route.schema) route.schema = {};

    if (route.schema.description) {
      route.schema.description =
        route.schema.description +
        '\n\n' +
        getErrorsTable(route.config.possibleErrors);
    } else {
      route.schema.description = getErrorsTable(route.config.possibleErrors);
    }
  });
};

export default fp(plugin);
