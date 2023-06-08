/**
 * this file is going to implement auto cast for `id` column in typeorm filters. because we
 * can not apply like filter on `id` column in postgresql
 */

import { FindOperator, FindOptionsWhere, Raw } from 'typeorm';

/**
 * ATTENTION! this function will mutate the origin object
 * @param filter
 * @returns
 */
export function autoCastId(filter: FindOptionsWhere<any>) {
  if (filter?.id instanceof FindOperator) {
    filter.id = Raw((column) => `${column} :: varchar(255) ilike :like`, {
      like: filter.id.value,
    });
  }

  return filter;
}
