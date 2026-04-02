## 1. Initial Cleanup & Renaming
- [ ] 1.1 Rename `apps/tin-hoc-tre/backend-api/auth.js` to `auth-middleware.js`.
- [ ] 1.2 Rename `apps/tin-hoc-tre/backend-api/auth (1).js` to `auth-routes.js`.
- [ ] 1.3 Remove duplicate `apps/tin-hoc-tre/server.js`.
- [ ] 1.4 Rename `apps/tin-hoc-tre/package-1.json` to `package.json`.

## 2. Infrastructure Setup
- [ ] 2.1 Create `apps/tin-hoc-tre-api` and initialize `package.json`.
- [ ] 2.2 Create `apps/tin-hoc-tre-judge` and initialize `package.json`.
- [ ] 2.3 Create `apps/tin-hoc-tre-extension` and initialize `package.json`.
- [ ] 2.4 Create `packages/tin-hoc-tre-problems` and initialize `package.json`.

## 3. Migration
- [ ] 3.1 Move backend API logic to `apps/tin-hoc-tre-api/src`.
- [ ] 3.2 Move worker logic to `apps/tin-hoc-tre-judge/src`.
- [ ] 3.3 Move extension assets to `apps/tin-hoc-tre-extension/assets`.
- [ ] 3.4 Move problem data to `packages/tin-hoc-tre-problems/data`.

## 4. Refactoring & Verification
- [ ] 4.1 Update all internal `require` and `import` paths to match the new structure.
- [ ] 4.2 Verify backend starts correctly.
- [ ] 4.3 Verify judge starts correctly.
- [ ] 4.4 Clean up old `apps/tin-hoc-tre` directory.
