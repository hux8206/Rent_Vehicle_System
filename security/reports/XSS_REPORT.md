# XSS Security Report

## Status: PASS

## Findings

1. **HTML Sanitization and Escaping**:
   The frontend is built with React 18 and Next.js 14 App Router. React automatically escapes all string interpolations in JSX expressions (`{variable}`) before writing to the DOM.
2. **Dangerous DOM Properties**:
   A global scan across `apps/web/src` confirmed zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or raw `document.write`.
3. **User Content Rendering**:
   Review comments, store names, vehicle descriptions, and user profiles are rendered exclusively via safe React elements.

## What's at risk

Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into pages viewed by other users, stealing session tokens or performing actions on their behalf.

## What's already secure

- Default React JSX auto-escaping protects against Reflected and Stored XSS.
- No `dangerouslySetInnerHTML` bypasses are present in the application.

## Recommendations

- If rich-text rendering is introduced in the future (e.g. for store descriptions), parse and sanitize the HTML using `DOMPurify` before rendering.

