import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

function pick(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function extractFirebaseFromBuild() {
  if (!existsSync('dist/assets')) return {};

  const bundle = readdirSync('dist/assets')
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(`dist/assets/${name}`, 'utf8'))
    .join('\n');

  if (!bundle) return {};

  return {
    projectId: bundle.match(/VITE_FIREBASE_PROJECT_ID:"([^"]+)"/)?.[1]
      || bundle.match(/projectId:"([^"]+)"/)?.[1]
      || '',
    apiKey: bundle.match(/VITE_FIREBASE_API_KEY:"([^"]+)"/)?.[1]
      || bundle.match(/apiKey:"([^"]+)"/)?.[1]
      || '',
  };
}

const fileEnv = {
  ...loadEnvFile('.env.local'),
  ...loadEnvFile('.dev.vars'),
};
const buildEnv = extractFirebaseFromBuild();

const projectId = pick(
  process.env.FIREBASE_PROJECT_ID,
  process.env.VITE_FIREBASE_PROJECT_ID,
  fileEnv.FIREBASE_PROJECT_ID,
  fileEnv.VITE_FIREBASE_PROJECT_ID,
  buildEnv.projectId,
  'komunita-popcorn',
);

const apiKey = pick(
  process.env.FIREBASE_API_KEY,
  process.env.VITE_FIREBASE_API_KEY,
  fileEnv.FIREBASE_API_KEY,
  fileEnv.VITE_FIREBASE_API_KEY,
  buildEnv.apiKey,
);

const siteUrl = (() => {
  const candidates = [
    process.env.SITE_URL,
    process.env.VITE_SITE_URL,
    fileEnv.SITE_URL,
    fileEnv.VITE_SITE_URL,
    'https://komunitapopcorn.cz',
  ];

  for (const value of candidates) {
    if (!value || value.includes('localhost')) continue;
    return value.replace(/\/$/, '');
  }

  return 'https://komunitapopcorn.cz';
})();

const args = ['deploy'];

if (projectId) {
  args.push('--var', `FIREBASE_PROJECT_ID:${projectId}`);
}

if (apiKey) {
  args.push('--var', `FIREBASE_API_KEY:${apiKey}`);
} else {
  console.warn('FIREBASE_API_KEY not found in env or build output.');
  console.warn('SSR will only work if FIREBASE_API_KEY is set in the Cloudflare Worker dashboard.');
}

if (siteUrl) {
  args.push('--var', `SITE_URL:${siteUrl}`);
}

console.log(`Deploying with SITE_URL=${siteUrl}`);
if (projectId) console.log(`Deploying with FIREBASE_PROJECT_ID=${projectId}`);
if (apiKey) console.log('Deploying with FIREBASE_API_KEY from build/env');

const result = spawnSync('wrangler', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
