# GET /api/v1/customers/:id/address

```ts
interface Address {
  provinceCode: string;
  provinceName: string;

  cityCode: string;
  cityName: string;

  streetCode: string | null;
  streetName: string;


  postalCode: string;
  number: number | null;
  building: number | null;
  stairway: number | null;
  floor: number | null;
  door: number | null;
  latitude: number | null;
  longitude: number | null;
}
```

# PUT /api/v1/customers/:id/address

```ts
interface Address {
  provinceCode: string;
  provinceName: string;

  cityCode: string;
  cityName: string;

  streetCode: string | null;
  streetName: string;


  postalCode: string;
  number: number | null;
  building: number | null;
  stairway: number | null;
  floor: number | null;
  door: number | null;
  latitude: number | null;
  longitude: number | null;
}
```