import fs from 'node:fs';
import path from 'node:path';

const aiSystemPath = process.env.AI_SYSTEM_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ai-system');
const skillsPath = process.env.AI_SKILLS_PATH || path.join(aiSystemPath, 'skills');
const registryPath = path.join(aiSystemPath, 'system', 'skill-registry.json');
const cachePath = path.join(aiSystemPath, 'cache', 'skills-cache.json');

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
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/[\s_-]+/)
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
  const candidates = ['manifest.json', 'SKILL.md', 'README.md', 'index.js', 'index.ts', 'main.py'];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(skillDir, candidate))) return candidate;
  }
  const files = fs.readdirSync(skillDir, { withFileTypes: true }).filter((entry) => entry.isFile());
  return files[0]?.name || '';
}

function extractTags(sourceText, maxTags = 12) {
  const frequency = new Map();
  for (const token of tokenize(sourceText)) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([tag]) => tag);
}

function buildFallbackManifest(skillDir, folderName) {
  const readme = safeRead(path.join(skillDir, 'README.md')) || safeRead(path.join(skillDir, 'SKILL.md'));

  let packageJson = null;
  try {
    packageJson = JSON.parse(safeRead(path.join(skillDir, 'package.json')) || 'null');
  } catch {
    packageJson = null;
  }

  const description =
    packageJson?.description ||
    readme
      .split('\n')
      .find((line) => line.trim() && !line.startsWith('#'))
      ?.trim() ||
    `${folderName} skill`;

  const tags = extractTags(
    [
      folderName,
      description,
      readme,
      packageJson?.description || '',
      (packageJson?.keywords || []).join(' ')
    ].join(' ')
  );

  return {
    name: packageJson?.name || folderName,
    description,
    tags,
    entry: inferEntry(skillDir),
    type: inferType(folderName, readme, packageJson)
  };
}

function getSkillsFingerprint(directories) {
  return directories
    .map((name) => {
      const full = path.join(skillsPath, name);
      const stat = fs.statSync(full);
      return `${name}:${stat.mtimeMs}`;
    })
    .join('|');
}

export function loadSkills(options = {}) {
  if (!fs.existsSync(skillsPath)) {
    throw new Error(`AI_SKILLS_PATH does not exist: ${skillsPath}`);
  }

  const directories = fs
    .readdirSync(skillsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const fingerprint = getSkillsFingerprint(directories);

  if (!options.forceRefresh && fs.existsSync(cachePath)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (cache?.fingerprint === fingerprint && Array.isArray(cache?.skills)) {
        return {
          generatedAt: cache.generatedAt,
          root: skillsPath,
          count: cache.skills.length,
          skills: cache.skills
        };
      }
    } catch {
    }
  }

  const skills = [];
  for (const folderName of directories) {
    const skillDir = path.join(skillsPath, folderName);
    const manifestPath = path.join(skillDir, 'manifest.json');

    let manifest;
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(safeRead(manifestPath));
      } catch {
        manifest = buildFallbackManifest(skillDir, folderName);
      }
    } else {
      manifest = buildFallbackManifest(skillDir, folderName);
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    }

    skills.push({
      name: manifest.name || folderName,
      description: manifest.description || `${folderName} skill`,
      tags: Array.isArray(manifest.tags) ? manifest.tags : [],
      entry: manifest.entry || '',
      type: manifest.type || 'function',
      repositoryFolder: folderName,
      absolutePath: skillDir
    });
  }

  const registry = {
    generatedAt: new Date().toISOString(),
    root: skillsPath,
    count: skills.length,
    skills
  };

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ generatedAt: registry.generatedAt, fingerprint, skills }, null, 2)}\n`,
    'utf8'
  );

  return registry;
}

export function detectBestSkills(query, limit = 5) {
  const queryTokens = tokenize(query || '');
  const skills = loadSkills().skills;
  return skills
    .map((skill) => {
      const bag = `${skill.name} ${skill.description} ${(skill.tags || []).join(' ')}`.toLowerCase();
      const score = queryTokens.reduce((sum, token) => sum + (bag.includes(token) ? 1 : 0), 0);
      return { skill, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.skill);
}

if (process.argv[1]?.endsWith('loadSkills.js')) {
  const query = process.argv.slice(2).join(' ');
  if (query) {
    console.log(JSON.stringify(detectBestSkills(query), null, 2));
  } else {
    console.log(JSON.stringify(loadSkills(), null, 2));
  }
}