# Development Log

Date: 2025-09-24
Environment: Windows 10 (Node v20.19.4)

## Repository setup
- Issue: Remote `origin` already existed and pointed to a different repo.
  - Error/Observation: `error: remote origin already exists.`
  - Resolution: Updated remote URL and pushed main.
    - Commands:
      - `git remote set-url origin https://github.com/SureshPricol/eON.git`
      - `git push -u origin main`

## Dependency installation and dev server
- Issue: `pnpm` not installed; initial attempt to use pnpm failed.
  - Error: `'pnpm' is not recognized as an internal or external command`
  - Resolution: Used npm instead.
    - Command: `npm install`

- Issue: `next` CLI not found when running npm script.
  - Error: `'next' is not recognized as an internal or external command`
  - Root cause: Local Next.js not installed in `node_modules`.
  - Resolution: Installed Next.js and React locally per package.json.
    - Command: `npm install next@14.2.16 react@18 react-dom@18`

- Issue: `npx next dev` pulled a different Next.js version (15.5.4) and tried to auto-install TypeScript deps via pnpm.
  - Error: `spawn pnpm ENOENT` during auto-install of `typescript`, `@types/react`, `@types/node`.
  - Root cause: npx fetched Next 15; Next’s auto-install path defaulted to pnpm which wasn’t installed.
  - Resolution:
    - Installed TypeScript dev dependencies locally.
      - `npm install -D typescript @types/react @types/node`
    - Avoided npx; used the local Next.js binary directly.
      - `node node_modules\next\dist\bin\next dev -p 3000`

- Issue: Port conflict on 3000.
  - Error: `EADDRINUSE: address already in use :::3000`
  - Resolution: Started on an alternate port.
    - Command: `node node_modules\next\dist\bin\next dev -p 3001`

- Issue: Windows file lock when writing Next.js trace file on port 3001.
  - Error: `EPERM: operation not permitted, open '.next\trace'`
  - Likely cause: File lock from previous/background process or antivirus.
  - Resolution/Notes:
    - Despite the EPERM message, server continued to Ready state.
    - If it recurs: stop other Next processes, delete `.next` folder, or retry on a clean port.

## Current status
- Next.js 14.2.16 dev server runs successfully.
- Verified routes compiled and served:
  - `/` (200), `/login`, `/documents/created`, `/documents/shared`, `/documents/approvals`, `/documents/archived`.
- Start command in use:
  - `node node_modules\next\dist\bin\next dev -p 3000`

## Recommendations
- Prefer the local binary or `npm run dev` (after ensuring local Next is installed) over `npx next dev` to avoid version drift.
- If port 3000 is busy: use `-p 3001` (or free the port).
- If `.next` gets locked on Windows: close other dev servers, delete `.next`, and retry.
