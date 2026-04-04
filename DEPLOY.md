# Deploy recomendado

Este proyecto ya esta preparado para desplegar el frontend y el backend por separado.

## Arquitectura recomendada

- Frontend React/Vite: Vercel
- Backend Express: Render
- Base de datos y autenticacion: Firebase

## 1. Variables de entorno

Crea un archivo `.env.local` para desarrollo si lo necesitas:

```bash
VITE_API_BASE=
```

Notas:
- En desarrollo puede ir vacio porque `vite.config.js` usa proxy a `http://localhost:3000`.
- En produccion debes apuntarlo a la URL publica del backend.

Ejemplo:

```bash
VITE_API_BASE=https://tu-backend.onrender.com
```

## 2. Backend en Render

Publica el repositorio como `Web Service`.

Configuracion sugerida:

- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Render usara la variable `PORT` automaticamente.

Cuando quede arriba, prueba:

```text
https://tu-backend.onrender.com/api/health
https://tu-backend.onrender.com/api/countries
```

## 3. Frontend en Vercel

Publica el mismo repositorio como proyecto frontend.

Configuracion sugerida:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Agrega esta variable de entorno en Vercel:

```bash
VITE_API_BASE=https://tu-backend.onrender.com
```

Luego redeploy.

## 4. Desarrollo local

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run client
```

O ambos:

```bash
npm run dev
```

## 5. Verificacion minima antes de compartir

- Registro funcionando
- Login funcionando
- Carga de paises, estados y ciudades
- Guardado de progreso
- Intercambios
- Chat

## 6. Camino recomendado a movil

La ruta mas sensata es:

1. publicar la web
2. convertirla en PWA
3. empaquetarla con Capacitor si quieres Android/iPhone

No recomiendo migrar todavia a React Native mientras aun estas validando la app con usuarios reales.
