# Backend (Node + Express + Prisma)

Quick start (after you copy the .env file):

1. Install dependencies

   cd backend
   npm install

2. Introspect your existing MySQL database and generate Prisma client

   # make sure DATABASE_URL in backend/.env points to your DB

   npx prisma db pull
   npx prisma generate

3. Run in development mode

   npm run dev

## Notes

- This scaffold exposes generic CRUD routes that are dynamically validated against
  information_schema. For best developer ergonomics, run `npx prisma db pull` to
  populate `prisma/schema.prisma` with typed models and then use the generated
  Prisma client for type-safe access.
