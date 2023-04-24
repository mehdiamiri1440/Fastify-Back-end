import AppDataSource from '$src/DataSource';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export const repo = <T extends ObjectLiteral>(model: EntityTarget<T>) => {
  return AppDataSource.getRepository<T>(model);
};
