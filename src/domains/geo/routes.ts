import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Response } from '$src/infra/Response';
import {
  generateQueryParamForPaginationAndOrder,
  getCities,
  getLikeFilter,
  getNumber,
  getProvince,
  getStreets,
} from './service';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/provinces',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name'],
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;
      const queryParams = generateQueryParamForPaginationAndOrder({
        page,
        pageSize,
        order: order ?? 'desc',
        orderBy: orderBy ?? 'id',
      });

      const filters = [];

      if (typeof filter?.code === 'object' && 'like' in filter.code) {
        filters.push({ key: 'code', value: filter.code.like });
      }

      if (typeof filter?.name === 'object' && 'like' in filter.name) {
        filters.push({ key: 'name', value: filter.name.like });
      }

      const filterHub = getLikeFilter(filters);

      if (filterHub) queryParams.append('filter', filterHub);
      const { provinces, meta } = await getProvince(queryParams);
      return new Response(provinces, {
        page: meta.current_page,
        pageSize,
        total: meta.total,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/cities',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name', 'provinceCode'],
      }),
    },
    async handler(req, rep) {
      const { page, pageSize, filter, order, orderBy } = req.query;
      const queryParams = generateQueryParamForPaginationAndOrder({
        page,
        pageSize,
        order: order ?? 'desc',
        orderBy: orderBy ?? 'id',
      });

      const filters = [];

      if (typeof filter?.code === 'object' && 'like' in filter.code) {
        filters.push({ key: 'code', value: filter.code.like });
      }

      if (typeof filter?.name === 'object' && 'like' in filter.name) {
        filters.push({ key: 'name', value: filter.name.like });
      }

      if (
        typeof filter?.provinceCode === 'object' &&
        filter?.provinceCode?.like
      ) {
        filters.push({
          key: 'GeoProvince.code',
          value: filter.provinceCode.like,
        });
      }

      const filterHub = getLikeFilter(filters);

      if (filterHub) queryParams.append('filter', filterHub);
      const { cities, meta } = await getCities(queryParams);
      return new Response(cities, {
        page: meta.current_page,
        pageSize,
        total: meta.total,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/streets',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name', 'cityCode'],
      }),
    },
    async handler(req, rep) {
      const { page, pageSize, filter, order, orderBy } = req.query;

      const queryParams = generateQueryParamForPaginationAndOrder({
        page,
        pageSize,
        order: order ?? 'desc',
        orderBy: orderBy ?? 'id',
      });

      const filters = [];

      if (typeof filter?.code === 'object' && 'like' in filter.code) {
        filters.push({ key: 'code', value: filter.code.like });
      }

      if (typeof filter?.name === 'object' && 'like' in filter.name) {
        filters.push({ key: 'name', value: filter.name.like });
      }

      if (typeof filter?.cityCode === 'object' && 'like' in filter.cityCode) {
        filters.push({
          key: 'GeoCity.code',
          value: filter.cityCode.like,
        });
      }

      const filterHub = getLikeFilter(filters);

      if (filterHub) queryParams.append('filter', filterHub);
      const { streets, meta } = await getStreets(queryParams);
      return new Response(streets, {
        page: meta.current_page,
        pageSize,
        total: meta.total,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/postal-codes',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'number', 'street_code'],
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;

      const queryParams = generateQueryParamForPaginationAndOrder({
        page,
        pageSize,
        order: order ?? 'desc',
        orderBy: orderBy ?? 'id',
      });

      const filters = [];

      if (typeof filter?.code === 'object' && 'like' in filter.code) {
        filters.push({ key: 'code', value: filter.code.like });
      }

      if (typeof filter?.name === 'object' && 'like' in filter.name) {
        filters.push({ key: 'name', value: filter.name.like });
      }

      if (
        typeof filter?.street_code === 'object' &&
        'like' in filter.street_code
      ) {
        filters.push({
          key: 'GeoStreet.code',
          value: filter.street_code.like,
        });
      }

      const filterHub = getLikeFilter(filters);

      if (filterHub) queryParams.append('filter', filterHub);
      const { numbers, meta } = await getNumber(queryParams);
      return new Response(numbers, {
        page: meta.current_page,
        pageSize,
        total: meta.total,
      });
    },
  });
};

export default plugin;
