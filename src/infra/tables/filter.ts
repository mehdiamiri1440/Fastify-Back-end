import { FastifyRequest } from 'fastify';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
} from 'typeorm';

function _toTypeOrmFilter(obj: any) {
  for (const key in obj) {
    const value = obj[key];
    if (value === undefined) {
      delete obj[key];
    } else if (value.$like) {
      obj[key] = Like(value.$like);
    } else if (value.$gte && value.$lte) {
      obj[key] = Between(value.$gte, value.$lte);
    } else if (value.$gte) {
      obj[key] = MoreThanOrEqual(value.$gte);
    } else if (value.$lte) {
      obj[key] = LessThanOrEqual(value.$lte);
    } else if (typeof value === 'object') {
      _toTypeOrmFilter(value);
    }
  }
}

export function toTypeOrmFilter(filter: any) {
  const clonedFilter = structuredClone(filter);
  _toTypeOrmFilter(clonedFilter);
  return clonedFilter;
}

export function merge(
  filters: (FindOptionsWhere<any> | undefined)[],
): FindOptionsWhere<any> {
  const merged: FindOptionsWhere<any> = {};
  for (const filter of filters) {
    if (!filter) {
      continue;
    }
    for (const key in filter) {
      const value = filter[key];
      if (merged[key]) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

export function from(req: FastifyRequest) {
  const { query } = req;
  if (!query) {
    return;
  }

  const { filter } = query as any;
  if (!filter) {
    return;
  }

  const clonedFilter = structuredClone(filter);
  toTypeOrmFilter(clonedFilter);

  return clonedFilter;
}
