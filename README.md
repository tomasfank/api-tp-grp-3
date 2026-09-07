# Vaultra Consulting Backend

API REST construida con Node.js, Express y MongoDB que expone los datos y la lógica de negocio del sitio de consultoría IT de Vaultra Consulting.

## Requisitos previos

- Node.js 20+
- MongoDB en ejecución (local o vía Docker)

## Configuración

Copiá el archivo de ejemplo de variables de entorno y ajustá los valores:

```bash
cp .env.example .env
```

Variables disponibles:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto HTTP del servidor | `3000` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/vaultra` |
| `JWT_SECRET` | Secreto para firmar los tokens JWT | — |

## Instalación

```bash
npm install
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor en modo desarrollo con recarga automática |
| `npm start` | Ejecuta el servidor compilado (`dist/server.js`) |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm test` | Ejecuta toda la suite de tests |
| `npm run test:unit` | Ejecuta solo los tests unitarios |
| `npm run test:integration` | Ejecuta solo los tests de integración |
| `npm run test:coverage` | Ejecuta los tests con reporte de cobertura |
| `npm run seed` | Precarga datos iniciales en la base de datos |

## Seed de datos

El proyecto incluye un seeder (`src/seed/seeder.ts`) que precarga datos de ejemplo
para poder trabajar con la API sin cargar contenido manualmente. Se ejecuta de
forma independiente al arranque del servidor:

```bash
npm run seed
```

El seeder se conecta a la base de datos indicada por `MONGODB_URI`, inserta los
datos y se desconecta al finalizar. Precarga:

- Al menos **4 categorías**: Cloud, Seguridad, Desarrollo e Infraestructura.
- Al menos **20 servicios** distribuidos entre las categorías, cada uno con
  nombre, descripción, al menos una URL de imagen, precio y estado `active`.
- Un registro de **BusinessInfo** de Vaultra Consulting con nombre, descripción
  y datos de contacto.

El seeder es **idempotente**: verifica los conteos de cada colección antes de
insertar, por lo que ejecutarlo varias veces no genera duplicados ni errores.
Si una colección ya tiene datos, esa parte del seed se omite.

> Asegurate de tener MongoDB en ejecución y `MONGODB_URI` correctamente
> configurado antes de correr el seeder.

## Docker

Podés levantar la API junto con una instancia de MongoDB usando Docker Compose:

```bash
docker compose up --build
```
