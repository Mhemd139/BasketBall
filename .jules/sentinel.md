# Sentinel's Journal

## 2025-05-22 - [Secure Session Implementation across Runtimes]
**Vulnerability:** Insecure session storage (plain JSON in cookie) allowed trivial session forgery.
**Learning:** Shared logic between Next.js Server Actions (Node runtime) and Middleware (Edge runtime) requires using Web Crypto API (`crypto.subtle`). Node.js `crypto` module is not available in Edge, and external libraries like `jose` might not be present.
**Prevention:** Always use `crypto.subtle` for cryptographic operations that need to run in both Node and Edge environments in Next.js. Avoid `require('crypto')` in shared libraries.
