import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import { readFileSync } from 'node:fs';

const plugin: FastifyPluginAsyncTypebox<{ path: string }> = async function (
  fastify,
  { path },
) {
  const file = readFileSync(path);
  const text = file.toString();

  const sections: Record<string, string> = {};

  let currentKey = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('# ')) {
      currentKey = line.replace('# ', '');
      sections[currentKey] = '';
    } else {
      sections[currentKey] += line + '\n';
    }
  }

  function getDescription({ method, url }: RouteOptions) {
    if (url.at(-1) === '/') {
      url = url.slice(0, -1);
    }

    const key = `${method === 'HEAD' ? 'GET' : method} ${url}`;
    const description = sections[key] ?? 'Ask for document';
    return description;
  }

  fastify.addHook('onRoute', (route) => {
    if (route.method == 'HEAD') return; // this is for avoiding duplicate document

    // Tags already defined, do nothing
    if (!route.schema) route.schema = {};

    if (route.schema.description) {
      route.schema.description =
        route.schema.description + '\n\n' + getDescription(route);
    } else {
      route.schema.description = getDescription(route);
    }
  });
};

export default fp(plugin);
