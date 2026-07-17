// Build script for Vercel deployment
// server/ contains all backend source code (.ts files).
// Vercel only scans api/ for functions, so .ts files in server/ are ignored.
// We bundle the entry points and drop the JS output into api/.

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const banner = 'import { createRequire } from \'module\';const require = createRequire(import.meta.url);';

// Build frontend
console.log('→ Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// Bundle Vercel serverless entry → api/index.js as TRUE CommonJS.
// The ESM + createRequire banner trick crashed on Vercel; a real CJS bundle
// uses native require() for Node built-ins and traces cleanly with nft.
// Root package.json has "type": "module", so api/package.json re-scopes
// the function directory back to CommonJS.
console.log('→ Bundling server/vercel-entry.ts for Vercel serverless (CJS)...');
execSync(
  'npx esbuild server/vercel-entry.ts --platform=node --bundle --format=cjs --outfile=api/index.js',
  { stdio: 'inherit' }
);
writeFileSync('api/package.json', JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
console.log('→ Wrote api/package.json with "type": "commonjs"');

// Bundle self-hosted Node.js entry → dist/boot.js
console.log('→ Bundling server/node-entry.ts for self-hosted...');
execSync(
  `npx esbuild server/node-entry.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="${banner}"`,
  { stdio: 'inherit' }
);

console.log('→ Build complete. api/ contains only the bundled index.js');
