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
- El **código de invitación** `VAULTRA-UADE-2026`, necesario para registrar
  administradores (ver [Registro con código de invitación](#registro-con-código-de-invitación)).

El seeder es **idempotente**: verifica los conteos de cada colección antes de
insertar, por lo que ejecutarlo varias veces no genera duplicados ni errores.
Si una colección ya tiene datos, esa parte del seed se omite.

> Asegurate de tener MongoDB en ejecución y `MONGODB_URI` correctamente
> configurado antes de correr el seeder.

## Registro con código de invitación

Crear una cuenta de administrador (`POST /api/auth/register`) requiere un
**código de invitación**. Los códigos se guardan en la colección
`invitationcodes` de MongoDB y **no tienen vencimiento ni límite de usos**: si
el código existe en la base, se puede usar para registrar cualquier cantidad de
cuentas.

> **Código para la corrección:** `VAULTRA-UADE-2026`
>
> Lo carga automáticamente `npm run seed`. Usalo en el campo
> "Código de invitación" del formulario de registro del frontend o en el body
> del request.

Ejemplo de request:

```json
POST /api/auth/register
{
  "name": "Admin",
  "lastName": "Vaultra",
  "email": "admin@vaultra.com",
  "password": "Admin1234!",
  "phone": "1122334455",
  "invitationCode": "VAULTRA-UADE-2026"
}
```

Respuestas posibles:

| Caso | Status |
|---|---|
| Registro exitoso | `201` |
| Falta `invitationCode` u otro campo inválido | `400` |
| El código de invitación no existe | `403` — `"Código de invitación inválido"` |
| El email ya está en uso | `409` |

Para habilitar un código adicional basta con insertarlo en la colección:

```bash
mongosh "$MONGODB_URI" --eval 'db.invitationcodes.insertOne({ code: "OTRO-CODIGO", createdAt: new Date(), updatedAt: new Date() })'
```

## Docker

Podés levantar la API junto con una instancia de MongoDB usando Docker Compose:

```bash
docker compose up --build
```
