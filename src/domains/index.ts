/* eslint-disable @typescript-eslint/ban-types */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';

async function listOfDomains() {
  const directory = new URL(`file://${process.cwd()}/src/domains`);

  const entities = await readdir(directory, { withFileTypes: true });
  return entities.filter((e) => e.isDirectory()).map((e) => e.name);
}

const isModel = (v: any) => {
  return getMetadataArgsStorage().tables.find(({ target }) => target === v);
};

async function loadDomainModels(domainName: string) {
  const directory = new URL(
    `file://${process.cwd()}/src/domains/${domainName}/models`,
  );

  const entities = await readdir(directory, { withFileTypes: true });
  const files = entities
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => e.name);

  const models: Function[] = [];
  for (const name of files) {
    const esmFilename = name.replace('.ts', '.js');
    const imported = await import(join(directory.pathname, esmFilename));
    const model = Object.values(imported).find(isModel);
    if (!model) continue;
    models.push(model as Function);
  }

  return models;
}

export const names = await listOfDomains();

export const models = (await Promise.all(names.map(loadDomainModels))).flat();
