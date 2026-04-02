# Change: Reorganize Tin-Hoc-Tre into Monorepo

## Why
The 'tin-hoc-tre' project is currently monolithic and contains several distinct components (API, Worker, Extension). To align with the overall repository's architecture and improve maintainability, it needs to be decomposed into modular apps and packages. This reorganization also removes duplicate files (`server.js`) and confusing filenames (`auth (1).js`).

## What Changes
- **Consolidate Backend API**: Merge `backend-api/` and `server.js` into a single standalone app: `apps/tin-hoc-tre-api`.
- **Isolate Worker Judge**: Move `headless-judge/` into a dedicated worker app: `apps/tin-hoc-tre-judge`.
- **Rebrand Extension**: Move Scratch extensions and frontend patches into `apps/tin-hoc-tre-extension`.
- **Modularize Problems**: Expose problem JSON data as a shared package: `packages/tin-hoc-tre-problems`.
- **Fix Naming**:
    - `auth.js` -> `auth-middleware.js`
    - `auth (1).js` -> `auth-routes.js`
- **BREAKING**: Change all internal `require` paths from monolithic `backend/*` and `headless-judge/*` to the new structure.

## Impact
- Specs: `tin-hoc-tre-api`, `tin-hoc-tre-judge`, `tin-hoc-tre-extension` (newly defined or updated)
- Code: 
    - `apps/tin-hoc-tre` (Deleted)
    - `apps/tin-hoc-tre-api` (New)
    - `apps/tin-hoc-tre-judge` (New)
    - `apps/tin-hoc-tre-extension` (New)
    - `packages/tin-hoc-tre-problems` (New)
