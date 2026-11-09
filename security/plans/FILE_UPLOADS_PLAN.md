# FILE_UPLOADS Fix Plan

## Changes

- `apps/web/src/app/api/upload/route.ts` —
  1. Add `MAX_FILE_SIZE = 5 * 1024 * 1024` (5MB). Reject uploads exceeding this limit with HTTP 400.
  2. Implement `validateImageMagicBytes(buffer: Buffer): string | null` verifying image headers for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WEBP (`52 49 46 46` ... `57 45 42 50`), and GIF (`47 49 46 38`). Reject any file with mismatched magic bytes with HTTP 400.

## New files

- None.

## Verification goals

- [x] Files larger than 5MB are rejected server-side.
- [x] Files disguised with fake `.png` or `.jpg` extensions are rejected via magic byte inspection.
- [x] Valid images continue uploading normally.

## Manual verification (for the human)

- Rename a text file to `test.png` and attempt to upload: verify it is rejected with "Định dạng file không hợp lệ".

