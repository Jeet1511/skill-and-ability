import { generateContext } from './generateContext.js';

const result = generateContext();
console.log(`Context generated at ${result.contextPath} with ${result.skillCount} skills.`);