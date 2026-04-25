## WahfaLab

Next.js app dengan Prisma, PostgreSQL, dan Supabase storage.

## Getting Started

Jalankan development server:

```bash
npm run dev
```

## Database Setup

File env yang dipakai:
- `.env`
- `.env.local`

Command utama:

```bash
npm run db:migrate
npm run db:seed
npm run db:seed:operational
```

Command gabungan:

```bash
npm run db:setup
npm run db:setup:verify
```

Manual schema bundle:

```bash
prisma/manual-setup.sql
```

Gunakan file ini kalau Anda ingin menjalankan semua migration schema lewat Supabase SQL Editor.
Setelah schema selesai, lanjutkan dengan seed:

```bash
npm run db:seed
npm run db:seed:operational
```

Reset command:

```bash
npm run db:reset:schema
npm run db:setup:reset
```

Utility command:

```bash
npm run db:check-roles
npm run db:fix-roles
npm run db:restore
npm run db:debug-login
```

## Notes

- Prisma memakai `DATABASE_URL` di `src/lib/prisma.ts`.
- Seed akun inti ada di `prisma/seed.ts`.
- Seed biaya operasional ada di `prisma/seed-operational-costs.ts`.
