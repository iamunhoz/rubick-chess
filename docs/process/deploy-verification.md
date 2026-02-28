# Deploy Verification Protocol

When changes are pushed to `main`, Netlify automatically builds and deploys the site at <https://famous-mermaid-fbdf37.netlify.app>. To ensure the live site is always on the latest version, follow this checklist every time you push:

1. **Stamp + push code** – merge/push the change as usual. Each build automatically emits a `<meta name="rubicks-chess-version">` tag in the document `<head>`, containing `shortGitHash-ISO8601Timestamp`.
2. **Wait 5 minutes** after pushing before checking the live site (gives Netlify time to build & deploy).
3. **Verify the version**:
   - Visit <https://famous-mermaid-fbdf37.netlify.app> (preferably with cache disabled) and view the page source/head.
   - Confirm `<meta name="rubicks-chess-version" content="...">` starts with the current local `git rev-parse --short HEAD` hash.
4. **If the version is not updated yet**, wait **1 minute** and re-check. Repeat until the live hash matches HEAD.
5. **Only notify XO after successful verification** that the deployed site matches the latest version.

These steps are mandatory for every push so we always know Netlify is serving the newest build.
