import { expect, it } from '@jest/globals';
import { describe } from 'node:test';
import { Between, LessThanOrEqual, Like, MoreThanOrEqual } from 'typeorm';
import { merge, toTypeOrmFilter } from './filter';

describe('toTypeOrmFilter function', () => {
  it('covert simple filters', () => {
    expect(
      toTypeOrmFilter({
        foo: 'bar',
        tar: {
          hey: 'ho',
        },
      }),
    ).toEqual({
      foo: 'bar',
      tar: {
        hey: 'ho',
      },
    });
  });

  it('covert $like', () => {
    expect(
      toTypeOrmFilter({
        foo: {
          $like: 'bar',
        },
        bar: {
          zar: {
            $like: 'zar',
          },
        },
      }),
    ).toEqual({
      foo: Like('bar'),
      bar: {
        zar: Like('zar'),
      },
    });
  });

  it('covert $like', () => {
    expect(
      toTypeOrmFilter({
        foo: {
          $like: 'bar',
        },
        bar: {
          zar: {
            $like: 'zar',
          },
        },
      }),
    ).toEqual({
      foo: Like('bar'),
      bar: {
        zar: Like('zar'),
      },
    });
  });

  it('covert $gte alone', () => {
    expect(
      toTypeOrmFilter({
        foo: {
          $gte: 5,
        },
        bar: {
          zar: {
            $gte: 5,
          },
        },
      }),
    ).toEqual({
      foo: MoreThanOrEqual(5),
      bar: {
        zar: MoreThanOrEqual(5),
      },
    });
  });

  it('covert $gte alone', () => {
    expect(
      toTypeOrmFilter({
        foo: {
          $lte: 5,
        },
        bar: {
          zar: {
            $lte: 5,
          },
        },
      }),
    ).toEqual({
      foo: LessThanOrEqual(5),
      bar: {
        zar: LessThanOrEqual(5),
      },
    });
  });

  it('covert $gte and $lte toughener', () => {
    expect(
      toTypeOrmFilter({
        foo: {
          $gte: 5,
          $lte: 10,
        },
        bar: {
          zar: {
            $gte: 5,
            $lte: 10,
          },
        },
      }),
    ).toEqual({
      foo: Between(5, 10),
      bar: {
        zar: Between(5, 10),
      },
    });
  });
});

describe('merge', () => {
  it('should merge many typeorm filter to one', () => {
    expect(
      merge([
        {
          foo: 'bar',
        },
        {
          hey: {
            bar: 'you',
          },
        },
      ]),
    ).toEqual({
      foo: 'bar',
      hey: {
        bar: 'you',
      },
    });
  });
});
