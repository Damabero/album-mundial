# Album Mundial 2026

Aplicacion digital de album de stickers del Mundial 2026 con React, Express y Firebase.

## Stack

- Frontend: React + Vite
- Backend/API: Node.js + Express
- Base de datos: Firebase Firestore
- Autenticacion: Firebase Auth
- Geolocalizacion: `country-state-city`

## Scripts

```bash
npm run dev      # frontend + backend
npm run client   # solo frontend Vite
npm run server   # solo backend Express
npm run build    # build de produccion del frontend
npm start        # servidor Express
```

## Desarrollo local

1. Instala dependencias:

```bash
npm install
```

2. Levanta todo en desarrollo:

```bash
npm run dev
```

3. Abre:

```text
http://localhost:5173
```

## Variables de entorno

Copia `.env.example` y crea `.env.local` si necesitas configurar una API publica:

```bash
VITE_API_BASE=
```

En desarrollo puede quedarse vacio. En produccion apunta al backend desplegado.

## API util

- `GET /api/health`
- `GET /api/countries`
- `GET /api/states/:country`
- `GET /api/cities/:country/:state`

## Deploy

La recomendacion actual es:

- Frontend en Vercel
- Backend en Render
- Firebase como servicio central

La guia paso a paso esta en [DEPLOY.md](./DEPLOY.md).
