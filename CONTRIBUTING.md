# Contributing to Plotroom

Fork the repository, create a branch, and open a pull request describing the problem and resulting behavior. For substantial features, an issue is a useful place to agree on scope first.

Use Node.js 22.12+ and install with `npm ci`. Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Keep CSV processing and exports in the browser. Add tests for changes that affect data interpretation, chart correctness, or downloads. Check both desktop and mobile layouts for UI changes. Do not include real personal datasets in fixtures or screenshots.

The shadcn/ui source is committed under `src/components/ui`. Add components using the project's `components.json` configuration. Charts live in `src/components/chart-preview.tsx`; chart labels and palettes are defined in `src/lib/chart-config.ts`.

Contributions are provided under the repository's MIT license.
