import fs from 'node:fs';
import path from 'node:path';
import { detectBestSkills } from './loadSkills.js';

const aiSystemPath = process.env.AI_SYSTEM_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ai-system');
const memoryFile = path.join(aiSystemPath, 'memory', 'shared-memory.json');

function readMemory() {
  if (!fs.existsSync(memoryFile)) return { events: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
    if (!Array.isArray(parsed.events)) return { events: [] };
    return parsed;
  } catch {
    return { events: [] };
  }
}

function writeMemory(memory) {
  fs.writeFileSync(memoryFile, `${JSON.stringify(memory, null, 2)}\n`, 'utf8');
}

export function runExecutionFlow(userInput) {
  const selectedSkills = detectBestSkills(userInput, 5);
  const execution = {
    userInput,
    flow: {
      planner: 'Decompose objective and dependencies.',
      researcher: 'Collect context and constraints.',
      executor: 'Apply tools and skill-selected actions.',
      reviewer: 'Validate outputs and requirement coverage.',
      optimizer: 'Improve maintainability and performance.'
    },
    selectedSkills: selectedSkills.map((item) => ({
      name: item.name,
      tags: item.tags,
      type: item.type
    }))
  };

  const memory = readMemory();
  memory.events.push({
    timestamp: new Date().toISOString(),
    type: 'execution',
    payload: execution
  });
  writeMemory(memory);

  return execution;
}

if (process.argv[1]?.endsWith('executionFlow.js')) {
  const userInput = process.argv.slice(2).join(' ') || 'default task';
  console.log(JSON.stringify(runExecutionFlow(userInput), null, 2));
}