import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};

  const vars = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    vars[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }
  return vars;
}

const env = {
  ...loadEnvFile('.env.local'),
  ...loadEnvFile('.dev.vars'),
};

const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
const apiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY;
const siteUrl = (() => {
  const candidates = [env.SITE_URL, env.VITE_SITE_URL, 'https://komunitapopcorn.cz'];
  for (const value of candidates) {
    if (!value || value.includes('localhost')) continue;
    return value.replace(/\/$/, '');
  }
  return 'https://komunitapopcorn.cz';
})();

if (!projectId || !apiKey) {
  console.error('Missing Firebase config for Worker SSR.');
  console.error('Set FIREBASE_PROJECT_ID and FIREBASE_API_KEY in .dev.vars or .env.local');
  process.exit(1);
}

const args = [
  'deploy',
  '--var',
  `FIREBASE_PROJECT_ID:${projectId}`,
  '--var',
  `FIREBASE_API_KEY:${apiKey}`,
  '--var',
  `SITE_URL:${siteUrl}`,
];

console.log(`Deploying with SITE_URL=${siteUrl}`);

const result = spawnSync('wrangler', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
