# GET /api/v1/qr/:code/info
To get info of a qr-code.
qr-codes can be in these types: `product`, `customer`, `inbound` and `outbound`


## Example Response 
```json
{
  "data": {
    "type": "product",
    "typeId": 1234
  }
}
```