// Fetches all .md/.mdx files from GitHub content repos at build time.
// Writes them into src/content/docs/{public,private}/ so Starlight finds them.

// Allow self-signed / intercepted TLS certs (corporate proxies, local dev).
// Vercel's build environment has valid certs so this is harmless in production.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { existsSync } from 'fs';
// Load .env.local first (local dev), fall back to .env (CI/Vercel uses env vars directly)
if (existsSync(new URL('../.env.local', import.meta.url))) {
  config({ path: new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
} else {
  config();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;

if (!token || !owner) {
  console.error('ERROR: GITHUB_TOKEN and GITHUB_OWNER must be set in .env.local');
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

const REPOS = [
  { repo: 'james-ai-public-notes',  dest: 'src/content/docs/public'  },
  { repo: 'james-ai-private-notes', dest: 'src/content/docs/private' },
];

async function fetchTree(repo) {
  try {
    const { data } = await octokit.git.getTree({
      owner, repo, tree_sha: 'HEAD', recursive: 'true',
    });
    return data.tree.filter(f => f.type === 'blob' && (f.path.endsWith('.md') || f.path.endsWith('.mdx')));
  } catch (e) {
    if (e.status === 404) {
      console.warn(`  WARN: repo ${owner}/${repo} not found or empty — skipping`);
      return [];
    }
    throw e;
  }
}

async function fetchFile(repo, filePath) {
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
  return Buffer.from(data.content, 'base64').toString('utf8');
}

async function sync({ repo, dest }) {
  const absDir = path.join(ROOT, dest);
  fs.rmSync(absDir, { recursive: true, force: true });
  fs.mkdirSync(absDir, { recursive: true });

  const files = await fetchTree(repo);
  if (files.length === 0) return;

  for (const file of files) {
    const content = await fetchFile(repo, file.path);
    const outPath = path.join(absDir, file.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`  synced  ${dest}/${file.path}`);
  }
}

console.log('\nSyncing content from GitHub...');
for (const r of REPOS) {
  console.log(`\n[${r.repo}]`);
  await sync(r);
}
console.log('\nSync complete.\n');
