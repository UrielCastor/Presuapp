# Presuapp Backend

Backend profesional en Node.js, Express, SQLite y Prisma ORM con Clean Architecture diseñado específicamente para **Profesionales Independientes** que requieran armar y cotizar presupuestos rápidos (Electricistas, Plomeros, etc).

## Características

- Catálogo de Trabajos / Items guardados (Máximo 10 en plan Free)
- Guardado de Clientes
- Manejo integral de Presupuestos (Generación PDF y Link para WhatsApp)
- Autenticación JWT (`bcrypt`)
- Testing con `Jest` y `Supertest`
- Base de datos manejable con Prisma `sqlite`.
- Clean Architecture (Capa Dominio, Aplicacion, Implementaciones, Interfaces)

## Ejecutar localmente

1. `npm install`
2. `npx prisma migrate dev --name init`
3. `npm run dev`

## Tests

El entorno probará contra una `test.db` aislada creada previamente con `npx prisma db push`.
Correr con: `npm test`

## Swagger / Docs

Ingresar a `/api/docs` una vez localmente instanciado para visualizar Open API 3.0.
