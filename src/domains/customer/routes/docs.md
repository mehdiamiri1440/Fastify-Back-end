# GET /api/v1/customers/:id/address

Response interface
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


interface Response {
  data: Address;
}
```

# PUT /api/v1/customers/:id/address

Request Body Interface:
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


# POST /api/v1/customers/:id/contacts

Request Body Interface:
```ts
interface Contact {
  position: null | string;
  name: null | string;
  surName: null | string;
  email: string;
  phoneNumber: string;
}
```

# PUT /api/v1/customers/:customerId/contacts/:contactId

Request Body Interface:
```ts
interface Contact {
  position: null | string;
  name: null | string;
  surName: null | string;
  email: string;
  phoneNumber: string;
}
```

# GET /api/v1/customers/:id/contacts

Response Interface:
```ts
interface Contact {
  id: number;
  position: null | string;
  name: null | string;
  surName: null | string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}


interface Response {
  data: Contact;
}
```