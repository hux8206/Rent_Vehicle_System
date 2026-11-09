# FILE_UPLOADS Security Report

## Status: HIGH

## Findings

1. **Extension-Only Validation**:
   `apps/web/src/app/api/upload/route.ts` previously determined file types using `file.name.split('.').pop()`. Extension-based validation can be bypassed by naming an executable script or HTML payload with an image extension (e.g., `payload.html.png`).
2. **Missing Server-Side Size Limit**:
   The upload endpoint accepted arbitrary upload payload sizes into memory buffer without checking `file.size`, creating Denial of Service (DoS) memory exhaustion risks.
3. **Safe Storage**:
   Uploaded files are renamed server-side using timestamps and random hex strings (`img-${Date.now()}-${random}.${ext}`) and stored on Cloudinary / R2 CDNs rather than executed on the web server.

## What's at risk

- **Server Memory Exhaustion (DoS)**: Attackers could send multi-gigabyte uploads to crash the Node.js server.
- **Polyglot / Malicious File Uploads**: Uploading non-image files masquerading as images could lead to stored XSS or content-type confusion.

## What's already secure

- Files are renamed server-side, preventing path traversal attacks (`../../evil.sh`).
- Files are primarily stored on third-party object storage/CDN.

## Recommendations

1. Enforce a strict 5MB maximum upload limit server-side.
2. Validate magic bytes (file signatures) for JPEG, PNG, WEBP, and GIF in memory buffer before proceeding with upload.

