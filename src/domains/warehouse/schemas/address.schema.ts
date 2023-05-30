import { Type } from '@sinclair/typebox';

export const AddressSchema = Type.Object({
  addressProvinceCode: Type.String({ default: 'S43' }),
  addressProvinceName: Type.String({ default: 'TARRAGONA' }),
  addressCityCode: Type.String({ default: 'C07.062' }),
  addressCityName: Type.String({ default: 'SON SERVERA' }),
  addressStreetCode: Type.String({ default: 'S43.001.00104' }),
  addressStreetName: Type.String({ default: 'Alicante  en  ur mas en pares' }),
  addressPostalCode: Type.String({ default: '7820' }),
  addressNumber: Type.Union([Type.Null(), Type.String()], { default: '9' }),
  addressNumberCode: Type.Union([Type.Null(), Type.String()], {
    default: 'N07.046.00097.00009.2965903CD5126N',
  }),
});
