import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import assert from 'assert';
import { Response } from '$src/infra/Response';
import { getCities, getNumber, getProvince, getStreets } from './service';
const { HUB_API_ADDRESS, HUB_TOKEN } = process.env;

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/provinces',
    schema: {
      tags: ['Geo'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name'],
      }),
    },
    async handler(req, rep) {
      assert(HUB_API_ADDRESS);
      assert(HUB_TOKEN);
      const { page, pageSize, filter, order, orderBy } = req.query as {
        page: number;
        pageSize: number;
        filter: any;
        order: string;
        orderBy: string;
      };
      const queryParams = new URLSearchParams();
      queryParams.append('page', `${page}`);
      queryParams.append('size', `${pageSize}`);
      let filterHub = '';
      if (filter?.code?.like)
        filterHub = `filter[code][like]=%${filter.code.like}%`;

      if (filter?.name?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[name][like]=%${filter.name.like}%`;

      let orderHub = '';
      if (!!order && !!orderBy) {
        orderHub = `order[${orderBy}]=${order}`;
        queryParams.append('order', orderHub);
      }

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
      tags: ['Geo'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name', 'province_code'],
      }),
    },
    async handler(req, rep) {
      assert(HUB_API_ADDRESS);
      assert(HUB_TOKEN);
      const { page, pageSize, filter, order, orderBy } = req.query as {
        page: number;
        pageSize: number;
        filter: any;
        order: string;
        orderBy: string;
      };
      const queryParams = new URLSearchParams();
      queryParams.append('page', `${page}`);
      queryParams.append('size', `${pageSize}`);
      let filterHub = '';
      if (filter?.code?.like)
        filterHub = `filter[code][like]=%${filter.code.like}%`;

      if (filter?.name?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[name][like]=%${filter.name.like}%`;

      if (filter?.province_code?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `${filterHub}&filter[GeoProvince.code][like]=%${filter.province_code.like}%`;

      let orderHub = '';
      if (!!order && !!orderBy) {
        orderHub = `order[${orderBy}]=${order}`;
        queryParams.append('order', orderHub);
      }

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
      tags: ['Geo'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'name', 'city_code'],
      }),
    },
    async handler(req, rep) {
      assert(HUB_API_ADDRESS);
      assert(HUB_TOKEN);
      const { page, pageSize, filter, order, orderBy } = req.query as {
        page: number;
        pageSize: number;
        filter: any;
        order: string;
        orderBy: string;
      };
      const queryParams = new URLSearchParams();
      queryParams.append('page', `${page}`);
      queryParams.append('size', `${pageSize}`);
      let filterHub = '';
      if (filter?.code?.like)
        filterHub = `filter[code][like]=%${filter.code.like}%`;

      if (filter?.name?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[name][like]=%${filter.name.like}%`;

      if (filter?.city_code?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[GeoCity.code][like]=%${filter.city_code.like}%`;

      let orderHub = '';
      if (!!order && !!orderBy) {
        orderHub = `order[${orderBy}]=${order}`;
        queryParams.append('order', orderHub);
      }

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
    url: '/postal_codes',
    schema: {
      tags: ['Geo'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['id'],
        searchable: ['code', 'number', 'street_code'],
      }),
    },
    async handler(req, rep) {
      assert(HUB_API_ADDRESS);
      assert(HUB_TOKEN);
      const { page, pageSize, filter, order, orderBy } = req.query as {
        page: number;
        pageSize: number;
        filter: any;
        order: string;
        orderBy: string;
      };
      const queryParams = new URLSearchParams();
      queryParams.append('page', `${page}`);
      queryParams.append('size', `${pageSize}`);
      let filterHub = '';
      if (filter?.code?.like)
        filterHub = `filter[code][like]=%${filter.code.like}%`;

      if (filter?.number?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[number][like]=%${filter.number.like}%`;

      if (filter?.street_code?.like)
        filterHub =
          (filterHub ? `${filterHub}&` : ``) +
          `filter[GeoStreet.code][like]=%${filter.street_code.like}%`;

      let orderHub = '';
      if (!!order && !!orderBy) {
        orderHub = `order[${orderBy}]=${order}`;
        queryParams.append('order', orderHub);
      }

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
