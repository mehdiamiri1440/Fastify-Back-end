/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-types */
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';

function listOfDomains() {
  const directory = new URL(`file://${process.cwd()}/src/domains`);

  const entities = readdirSync(directory, { withFileTypes: true });
  return entities.filter((e) => e.isDirectory()).map((e) => e.name);
}

const isModel = (v: any) => {
  return getMetadataArgsStorage().tables.find(({ target }) => target === v);
};

function loadDomainModels(domainName: string) {
  const directory = new URL(
    `file://${process.cwd()}/src/domains/${domainName}/models`,
  );

  const exist = existsSync(directory);
  if (!exist) return [];

  const entities = readdirSync(directory, { withFileTypes: true });
  const files = entities
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => e.name);

  const models: Function[] = [];
  for (const name of files) {
    const esmFilename = name.replace('.ts', '');
    const imported = require(join(directory.pathname, esmFilename));
    const model = Object.values(imported).find(isModel);
    if (!model) continue;
    models.push(model as Function);
  }

  return models;
}

export const names = listOfDomains();

export const models = names.map(loadDomainModels).flat();
