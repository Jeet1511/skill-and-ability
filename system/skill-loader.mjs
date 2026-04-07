import { detectBestSkills, loadSkills } from './loadSkills.js';

export function getAllSkills() {
  return loadSkills().skills;
}

export function searchSkills(query, limit = 8) {
  return detectBestSkills(query, limit);
}

if (process.argv[1] && process.argv[1].endsWith('skill-loader.mjs')) {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.log(JSON.stringify(loadSkills(), null, 2));
  } else {
    console.log(JSON.stringify(searchSkills(query), null, 2));
  }
}