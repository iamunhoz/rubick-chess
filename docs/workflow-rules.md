# Workflow Rules

These rules apply to every change in this repository so that any agent can follow the same process.

## 1. Branch + Merge Discipline
- Do work on a feature branch.
- After committing, immediately merge the branch into `main` locally and push `main` (no PR stage because XO is the sole dev).
- Push the feature branch as well if we want to keep it for reference, but the source of truth is always `main`.

## 2. Production Deployment Verification
After every push to `main`, verify that the Netlify deployment picked up the latest build.

1. Record the expected version (use `git rev-parse --short HEAD` or the `__BUILD_VERSION__` embedded in `index.html`).
2. Wait **2 minutes** to give the pipeline time to build.
3. Run:
   ```bash
   curl -s https://famous-mermaid-fbdf37.netlify.app | grep -i "rubicks-chess-version"
   ```
   Or use another method to read the `<meta name="rubicks-chess-version" ...>` tag from the page head.
4. If the fetched version matches the expected version, the deploy is good.
5. If it does **not** match, wait another 2 minutes and repeat the curl check.
6. After the second failure, stop looping and warn XO that the deployed version is stale.

These steps must run for every push to `main` so we know production is current.
