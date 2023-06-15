import { Type } from '@sinclair/typebox';

export const AddressSchema = Type.Object({
  provinceCode: Type.String(),
  provinceName: Type.String(),

  cityCode: Type.String(),
  cityName: Type.String(),

  streetCode: Type.Union([Type.Null(), Type.String()]),
  streetName: Type.String(),

  postalCode: Type.String(),
  numberCode: Type.Union([Type.Null(), Type.String()]),
  number: Type.Union([Type.Null(), Type.String()]),
  building: Type.Union([Type.Null(), Type.String()]),
  stairway: Type.Union([Type.Null(), Type.String()]),
  floor: Type.Union([Type.Null(), Type.String()]),
  door: Type.Union([Type.Null(), Type.String()]),
  latitude: Type.Union([Type.Null(), Type.Number()]),
  longitude: Type.Union([Type.Null(), Type.Number()]),

  formatted: Type.String(),
});
