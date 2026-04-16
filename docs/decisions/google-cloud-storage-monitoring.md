# Decision: Monitor @google-cloud/storage v7.19.0

**Date**: 2026-04-16  
**Status**: MONITORING  
**Risk Level**: 🟢 LOW (zero production risk)

## Current State

- Package: @google-cloud/storage@7.19.0 (latest v7)
- Vulnerability: 1 low (teeny-request → http-proxy-agent)
- Production Impact: NONE (direct GCS connection, no HTTP proxy)

## Analysis

Attempted upgrade to v8 — **v8 does not exist yet** (latest is 7.19.0 as of 2026-04-16).
The vulnerability is in the HTTP transport layer (`teeny-request` → `http-proxy-agent` → `@tootallnate/once`)
and is only exploitable when routing through an HTTP proxy, which is not the case in production
(Oracle VM connects directly to GCS).

APIs used in `backend/src/shared/storage/gcs-storage.service.ts`:
- `new Storage({ keyFilename })` — stable
- `storage.bucket().file()` — stable
- `blob.createWriteStream()` — stable
- `bucket.getFiles({ prefix })` — stable
- `file.delete()` — stable
- `file.getMetadata()` — stable

All are core-stable APIs with no known breaking changes planned for v8.

## Action

**No action needed now.** Fix is not available (v8 not released).

## When to Upgrade

When `@google-cloud/storage@v8` is released:

1. Subscribe: https://github.com/googleapis/nodejs-storage/releases
2. Review changelog for breaking changes in `Storage()` constructor and `getMetadata()` typing
3. Branch: `chore/upgrade-google-cloud-storage`
4. Run: `npm install @google-cloud/storage@^8 --legacy-peer-deps`
5. Run: `npm run build && npm test`
6. Deploy when stable

## Approved By

- Audit: Cascade (16/04/2026)
- Analysis: verified via `npm view @google-cloud/storage versions`
- Status: APPROVED FOR MONITORING
