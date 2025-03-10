// Simple script to test Eden's solution
const fs = require('fs');
const vm = require('vm');

// Tracking variables
const alertMessages = [];
const consoleMessages = [];
const callCounts = { 
  alert: 0, 
  prompt: 0, 
  consoleLog: 0 
};

// Mock functions
const mockAlert = msg => { 
  callCounts.alert++; 
  alertMessages.push(msg); 
  console.log(`Alert called with: ${msg}`);
};

const mockConsoleLog = msg => { 
  callCounts.consoleLog++; 
  consoleMessages.push(msg); 
  console.log(`Console.log called with: ${msg}`);
};

const mockPrompt = (msg) => { 
  callCounts.prompt++; 
  console.log(`Prompt called with: ${msg}`);
  return callCounts.prompt === 1 ? 'Eden' : 'Tenenbaum'; 
};

// Create sandbox
const sandbox = {
  console: { log: mockConsoleLog },
  alert: mockAlert,
  prompt: mockPrompt,
  window: {},
  document: {}
};

// Read Eden's file
const studentPath = '/Volumes/Extreme 2T/Dropbox/CaFeb25-ExerciseSubmission/Eden Tenenbaum/Day1-10-ExRunner/Exercise-Runner/ex/01.js';
console.log(`Reading file: ${studentPath}`);

try {
  const code = fs.readFileSync(studentPath, 'utf8');
  
  // Log file content for debugging
  console.log('\nFile content:');
  console.log('-'.repeat(40));
  console.log(code);
  console.log('-'.repeat(40));
  console.log(`File length: ${code.length} characters`);
  
  // Execute the code
  const context = vm.createContext(sandbox);
  const script = new vm.Script(code);
  console.log('\nExecuting code...');
  script.runInContext(context);
  
  // Show results
  console.log('\nExecution results:');
  console.log(`Alert called ${callCounts.alert} times`);
  console.log(`Alert messages: ${JSON.stringify(alertMessages)}`);
  console.log(`Console.log called ${callCounts.consoleLog} times`);
  console.log(`Console messages: ${JSON.stringify(consoleMessages)}`);
  
  // Test requirements
  const passesRequirements = 
    callCounts.prompt >= 2 && 
    callCounts.alert + callCounts.consoleLog > 0 &&
    code.includes('fullName');
  
  console.log(`\nPasses requirements: ${passesRequirements}`);
} catch (error) {
  console.error('Error during execution:', error);
} 