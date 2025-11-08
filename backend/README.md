# Backend

## Prerequisites

- Node.js

## Setup

Fill in `.env` file:

- https://developers.google.com/identity/protocols/oauth2/web-server

## Development

```sh
npm install
```

Run with test endpoint(s):

```sh
npm run dev
```

Run in production mode:

```sh
npm start
```

Endpoints are file-based. For example, `src/test.js` will map to `/test` and `src/auth/login.js` to `/auth/login`.
