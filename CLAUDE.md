# Annuva – notes for AI assistants

Read the README first (Development → Conventions). The rules in short:

- Never commit or push without explicit consent of the maintainer.
- IntelliJ code style: 4 spaces, single quotes, semicolons, trailing commas in multiline literals,
  `else`/`catch`/`finally` on a new line, always braces, aligned object values.
- One interface, class or component per file. Only `export default`; named exports only where
  Next.js requires them (route handlers, `generateMetadata`, `metadata`, `dynamic`, `register`).
- ESM only. Code, comments and docs in English. UI texts only via `src/translations/{de,en}`.
- Amounts are integer cents, percentages/quantities integer hundredths, dates `YYYY-MM-DD`.
- New fields/entities: definition in `src/entity/definitions`, migration in
  `src/server/db/migrations`, translations – everything else is generated from the definition.
- Before finishing: `npm test` (typecheck, oxlint, vitest) and `npm run build` must pass.
- Conventional Commits; `develop` is the working branch, `main` releases.
