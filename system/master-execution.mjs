import { runExecutionFlow } from './executionFlow.js';

export function execute(userInput) {
  return runExecutionFlow(userInput);
}

if (process.argv[1] && process.argv[1].endsWith('master-execution.mjs')) {
  const input = process.argv.slice(2).join(' ') || 'default task';
  console.log(JSON.stringify(execute(input), null, 2));
}