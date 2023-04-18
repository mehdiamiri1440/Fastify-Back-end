const { HUB_API_ADDRESS, HUB_TOKEN } = process.env;
import assert from 'assert';
import { cityDto, numberDto, provinceDto, streetDto } from './dto';

export async function getProvince(queryParams: URLSearchParams) {
  assert(HUB_API_ADDRESS);
  assert(HUB_TOKEN);

  const response = await fetch(
    `${HUB_API_ADDRESS}/geo/province?${queryParams}`,
    {
      method: 'GET',
    },
  );
  if (!response.ok) {
    throw new Error('can not fetch data');
  }
  const responseData = (await response.json()) as any;
  return {
    provinces: responseData.data.map(provinceDto),
    meta: responseData.meta,
  };
}

export async function getCities(queryParams: URLSearchParams) {
  assert(HUB_API_ADDRESS);
  assert(HUB_TOKEN);

  const response = await fetch(`${HUB_API_ADDRESS}/geo/city?${queryParams}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('can not fetch data');
  }
  const responseData = (await response.json()) as any;
  return {
    cities: responseData.data.map(cityDto),
    meta: responseData.meta,
  };
}

export async function getStreets(queryParams: URLSearchParams) {
  assert(HUB_API_ADDRESS);
  assert(HUB_TOKEN);

  const response = await fetch(`${HUB_API_ADDRESS}/geo/street?${queryParams}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('can not fetch data');
  }
  const responseData = (await response.json()) as any;
  return {
    streets: responseData.data.map(streetDto),
    meta: responseData.meta,
  };
}

export async function getNumber(queryParams: URLSearchParams) {
  assert(HUB_API_ADDRESS);
  assert(HUB_TOKEN);

  const response = await fetch(`${HUB_API_ADDRESS}/geo/number?${queryParams}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('can not fetch data');
  }
  const responseData = (await response.json()) as any;
  return {
    numbers: responseData.data.map(numberDto),
    meta: responseData.meta,
  };
}

export function getLikeFilter(keyValues: { key: string; value: string }[]) {
  const filters = keyValues.map(
    (keyValue) => `filter[${keyValue.key}][like]=%${keyValue.value}%`,
  );

  return filters.join('&');
}

export function generateQueryParamForPaginationAndOrder(query: {
  page: number;
  pageSize: number;
  order: string;
  orderBy: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', `${query.page}`);
  queryParams.append('size', `${query.pageSize}`);

  const orderBy = query.orderBy;
  const order = query.order;
  if (!!order && !!orderBy) {
    queryParams.append('order', `order[${orderBy}]=${order}`);
  }

  return queryParams;
}
