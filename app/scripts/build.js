// Build script for Vercel deployment
// server/ contains all backend source code (.ts files).
// Vercel only scans api/ for functions, so .ts files in server/ are ignored.
// We bundle the entry points and drop the JS output into api/.

import { execSync } from 'node:child_process';

const banner = 'import { createRequire } from \'module\';const require = createRequire(import.meta.url);';

// Build frontend
console.log('→ Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// Bundle Vercel serverless entry → api/index.js
console.log('→ Bundling server/vercel-entry.ts for Vercel serverless...');
execSync(
  `npx esbuild server/vercel-entry.ts --platform=node --bundle --format=esm --outfile=api/index.js --banner:js="${banner}"`,
  { stdio: 'inherit' }
);

// Bundle self-hosted Node.js entry → dist/boot.js
console.log('→ Bundling server/node-entry.ts for self-hosted...');
execSync(
  `npx esbuild server/node-entry.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="${banner}"`,
  { stdio: 'inherit' }
);

console.log('→ Build complete. api/ contains only the bundled index.js');
