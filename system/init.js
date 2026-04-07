import fs from 'node:fs';
import path from 'node:path';
import { loadSkills } from './loadSkills.js';
import { generateContext } from './generateContext.js';

const aiSystemPath = process.env.AI_SYSTEM_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ai-system');

function ensureStructure() {
  const requiredDirs = ['skills', 'agents', 'memory', 'system', 'tools', 'cache', 'scripts'];
  for (const directory of requiredDirs) {
    fs.mkdirSync(path.join(aiSystemPath, directory), { recursive: true });
  }

  const memoryPath = path.join(aiSystemPath, 'memory', 'shared-memory.json');
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, `${JSON.stringify({ events: [] }, null, 2)}\n`, 'utf8');
  }
}

export function initializeSystem(options = {}) {
  ensureStructure();
  const registry = loadSkills({ forceRefresh: Boolean(options.forceRefresh) });
  const context = generateContext();

  const status = {
    initializedAt: new Date().toISOString(),
    aiSystemPath,
    skillsLoaded: registry.count,
    registryPath: path.join(aiSystemPath, 'system', 'skill-registry.json'),
    contextPath: context.contextPath,
    memoryPath: path.join(aiSystemPath, 'memory', 'shared-memory.json'),
    agentsPath: path.join(aiSystemPath, 'agents')
  };

  fs.writeFileSync(path.join(aiSystemPath, 'system', 'status.json'), `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  return status;
}

if (process.argv[1]?.endsWith('init.js')) {
  const forceRefresh = process.argv.includes('--force-refresh');
  const result = initializeSystem({ forceRefresh });
  console.log(JSON.stringify(result, null, 2));
}