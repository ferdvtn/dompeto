# Repository Guidelines

## Project Structure & Module Organization
Dompeto is an AI-assisted personal finance app built with Next.js App Router, React, TypeScript, Tailwind CSS, and Turso SQLite.
- `app/(main)/` contains dashboard, transactions, charts, chat, and settings pages; `app/login/` handles sign-in.
- `app/api/` contains route handlers for authentication, transactions, AI, statistics, and settings.
- `components/` holds feature components; `components/ui/` holds shared UI primitives.
- `lib/` contains database, authentication, AI, Jakarta date, and rupiah helpers.
- `public/` stores icons and static assets; `scripts/migrate-db.mjs` initializes the database. `proxy.ts` handles request authentication.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local development at `http://localhost:3000`.
- `npm run build`: create the production build.
- `npm start`: serve a completed production build.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.
- `node scripts/migrate-db.mjs`: recreate and seed database tables using `.env.local`. **This drops existing tables; use a disposable development database.**

## Coding Style & Naming Conventions
Use strict TypeScript and the `@/` import alias for repository-root imports. Follow nearby source files: application code generally uses tabs, double quotes, and no semicolons. Use kebab-case component filenames, PascalCase component exports, and camelCase functions and variables. Follow App Router names such as `page.tsx`, `layout.tsx`, and `route.ts`. Reuse UI primitives and date/currency helpers. No dedicated formatter is configured.

## Testing Guidelines
No automated test framework, test script, or coverage threshold is currently configured. Run lint and a production build before submitting changes; report any failures. Manually verify affected flows, including sign-in, transaction editing, AI input, chart navigation, and mobile layouts. Check Jakarta dates and rupiah values when changing financial logic.

## Commit & Pull Request Guidelines
Recent commits use `Feat:` and `Fix:` prefixes. Follow that pattern with a specific summary, for example `Fix: Correct monthly budget calculation`. Describe behavior changes, validation performed, and any configuration or database impact in pull requests. Link relevant issues and attach screenshots for UI changes.

## Security & Configuration
Keep secrets in ignored `.env.local`: `APP_PASSWORD`, `APP_JWT_SECRET` (at least 32 characters), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `GROQ_API_KEY`. Never commit credentials or personal financial data. Preserve HTTP-only authentication cookies and parameterized database queries.
