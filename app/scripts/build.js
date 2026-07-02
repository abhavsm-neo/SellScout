// Build script for Vercel deployment
// Bundles the API entry points, then deletes raw .ts files on Vercel
// so Vercel doesn't try to compile them as separate serverless functions.

import { execSync } from 'node:child_process';
import { readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const banner = 'import { createRequire } from \'module\';const require = createRequire(import.meta.url);';
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

function deleteTsFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      deleteTsFiles(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      unlinkSync(fullPath);
      console.log(`  deleted: ${fullPath}`);
    }
  }
}

// Build frontend
console.log('→ Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// Bundle API entry for Vercel serverless
console.log('→ Bundling api/index.ts for Vercel serverless...');
execSync(
  `npx esbuild api/index.ts --platform=node --bundle --format=esm --outfile=api/index.js --banner:js="${banner}"`,
  { stdio: 'inherit' }
);

// Bundle API entry for self-hosted Node.js
console.log('→ Bundling api/boot.ts for self-hosted...');
execSync(
  `npx esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist --banner:js="${banner}"`,
  { stdio: 'inherit' }
);

// On Vercel: delete raw .ts files so they aren't compiled as separate functions
if (isVercel) {
  console.log('→ Cleaning up .ts files from api/ for Vercel...');
  deleteTsFiles('api');
  console.log('→ Vercel build complete. api/ now contains only the bundled index.js');
} else {
  console.log('→ Local build complete. (Skipped .ts cleanup — not on Vercel)');
}
