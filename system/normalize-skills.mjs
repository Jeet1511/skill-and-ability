import fs from 'node:fs';
import path from 'node:path';

const aiSystemPath = process.env.AI_SYSTEM_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ai-system');
const skillsPath = process.env.AI_SKILLS_PATH || path.join(aiSystemPath, 'skills');
const registryPath = path.join(aiSystemPath, 'system', 'skill-registry.json');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'into', 'using',
  'skill', 'skills', 'agent', 'agents', 'repo', 'repository', 'awesome', 'project'
]);

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/[\s_\-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function inferType(folderName, readme, packageJson) {
  const haystack = `${folderName} ${readme} ${JSON.stringify(packageJson || {})}`.toLowerCase();
  if (haystack.includes('workflow')) return 'workflow';
  if (haystack.includes('agent')) return 'agent';
  return 'function';
}

function inferEntry(skillDir) {
  const candidates = [
    'manifest.json',
    'SKILL.md',
    'README.md',
    'index.js',
    'index.ts',
    'main.py'
  ];
  for (const candidate of candidates) {
    const absolute = path.join(skillDir, candidate);
    if (fs.existsSync(absolute)) return candidate;
  }
  const files = fs.readdirSync(skillDir, { withFileTypes: true });
  const firstFile = files.find((entry) => entry.isFile());
  return firstFile ? firstFile.name : '';
}

function buildManifest(skillDir, folderName) {
  const readme = safeRead(path.join(skillDir, 'README.md')) || safeRead(path.join(skillDir, 'SKILL.md'));

  let packageJson = null;
  try {
    packageJson = JSON.parse(safeRead(path.join(skillDir, 'package.json')) || 'null');
  } catch {
    packageJson = null;
  }

  const textPool = `${folderName} ${readme} ${packageJson?.description || ''} ${(packageJson?.keywords || []).join(' ')}`;
  const frequency = new Map();
  for (const token of tokenize(textPool)) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  const tags = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);

  const description =
    packageJson?.description ||
    (readme.split('\n').find((line) => line.trim() && !line.startsWith('#')) || `${folderName} skill`).trim();

  return {
    name: packageJson?.name || folderName,
    description,
    tags,
    entry: inferEntry(skillDir),
    type: inferType(folderName, readme, packageJson)
  };
}

function normalizeSkills() {
  if (!fs.existsSync(skillsPath)) {
    throw new Error(`Skills path not found: ${skillsPath}`);
  }

  const directories = fs
    .readdirSync(skillsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const registry = {
    generatedAt: new Date().toISOString(),
    root: skillsPath,
    count: directories.length,
    skills: []
  };

  for (const folderName of directories) {
    const skillDir = path.join(skillsPath, folderName);
    const manifestPath = path.join(skillDir, 'manifest.json');

    let manifest;
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(safeRead(manifestPath));
      } catch {
        manifest = buildManifest(skillDir, folderName);
      }
    } else {
      manifest = buildManifest(skillDir, folderName);
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    }

    registry.skills.push({
      ...manifest,
      repositoryFolder: folderName,
      absolutePath: skillDir
    });
  }

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  return registry;
}

const registry = normalizeSkills();
console.log(`Normalized ${registry.count} skills into ${registryPath}`);