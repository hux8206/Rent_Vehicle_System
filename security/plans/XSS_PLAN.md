# XSS Fix Plan

## Changes

- None required.

## New files

- None.

## Verification goals

- [x] No `dangerouslySetInnerHTML` or `innerHTML` used with unsanitized user content.
- [x] All dynamic user strings are safely encoded by React.

## Manual verification (for the human)

- Submit a review comment containing `<script>alert('xss')</script>`: verify it renders literally as plain text rather than executing JavaScript.

