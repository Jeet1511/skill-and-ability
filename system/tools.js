import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function runCommand(command, options = {}) {
  const cwd = options.cwd || process.cwd();
  return execSync(command, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

export function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

export function listFiles(directoryPath, options = {}) {
  const recursive = Boolean(options.recursive);
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 5;
  const output = [];

  function walk(currentPath, depth) {
    if (depth > maxDepth) return;
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      output.push(fullPath);
      if (recursive && entry.isDirectory()) {
        walk(fullPath, depth + 1);
      }
    }
  }

  walk(directoryPath, 0);
  return output;
}

export function browseWeb(instruction) {
  const escaped = instruction.replace(/"/g, '\\"');
  return runCommand(`python -m browser_use "${escaped}"`);
}