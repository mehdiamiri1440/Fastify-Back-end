# POST /api/v1/token
## for authentication and authorization we are using oauth2 standard (password flow with refresh token)

### you can get access token and refresh token with two grant types:

1. in grant type password you must send username (its email here) and password 
```ts
interface Body {
    "grant_type": "password",
    "username": "user@example.com",
    "password": "hackme"
}
```

2. in grant type refresh_token you must send your refresh token
```ts
interface Body {
    "grant_type": "refresh_token",
    "refresh_token": "xxxxxxxxxxx"
}
```

with access token you can access to other parts of app

```
      front                                         back
┌───────────────┐   user/pass||refresh_token  ┌──────────────┐
│               ├─────────────────────────────►              │
│               │           /token            │              │
│               ◄─────────────────────────────┤              │
│               │ refresh_token&&access_token │              │
│               │                             │     auth     │
│               │                             │              │
│               │                             │              │
│    supplier   │                             │              │
│               │                             │              │
│               │                             └──────────────┘
│               │
│               │       access_token          ┌──────────────┐
│               ├─────────────────────────────►              │
│               │         /suppliers          │   supplier   │
│               ◄─────────────────────────────┤              │
└───────────────┘       suppliers_data        └──────────────┘
```