import fs from 'node:fs';
import path from 'node:path';
import { loadSkills } from './loadSkills.js';

const aiSystemPath = process.env.AI_SYSTEM_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ai-system');
const contextPath = path.join(aiSystemPath, 'system', 'context.md');

export function generateContext() {
  const registry = loadSkills();

  const lines = [];
  lines.push('# Global AI System Context');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Core Execution Flow');
  lines.push('User Input → Planner → Skill Detection (semantic) → Tool Selection → Execution → Review → Optimization');
  lines.push('');
  lines.push('## System Abilities');
  lines.push('- Multi-agent orchestration with planner/researcher/executor/reviewer/optimizer');
  lines.push('- Skill auto-discovery from AI_SKILLS_PATH with manifest and fallback metadata support');
  lines.push('- Shared memory in ~/.ai-system/memory/shared-memory.json');
  lines.push('- Global auto-linking via ./.ai to ~/.ai-system');
  lines.push('');
  lines.push('## Tool Capabilities');
  lines.push('- runCommand(command, options)');
  lines.push('- readFile(filePath)');
  lines.push('- writeFile(filePath, content)');
  lines.push('- listFiles(directoryPath, options)');
  lines.push('');
  lines.push(`## Skill Catalog (${registry.count})`);

  for (const skill of registry.skills) {
    lines.push(`- **${skill.name}**`);
    lines.push(`  - description: ${skill.description}`);
    lines.push(`  - tags: ${(skill.tags || []).join(', ') || 'none'}`);
    lines.push(`  - type: ${skill.type}`);
    lines.push(`  - entry: ${skill.entry || 'n/a'}`);
    lines.push(`  - location: ${skill.repositoryFolder}`);
  }

  fs.writeFileSync(contextPath, `${lines.join('\n')}\n`, 'utf8');
  return { contextPath, skillCount: registry.count };
}

if (process.argv[1]?.endsWith('generateContext.js')) {
  const result = generateContext();
  console.log(`Context generated at ${result.contextPath} with ${result.skillCount} skills.`);
}