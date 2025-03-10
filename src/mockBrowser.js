// Mock implementations for browser functions

// Store prompt responses for verification
const promptResponses = []
const alertMessages = []
const consoleMessages = []

// Track function call counts
const callCounts = {
  prompt: 0,
  alert: 0,
  consoleLog: 0
}

// Reset all stored messages/responses and call counts
const resetMocks = () => {
  promptResponses.length = 0
  alertMessages.length = 0
  consoleMessages.length = 0
  
  // Reset call counts
  callCounts.prompt = 0
  callCounts.alert = 0
  callCounts.consoleLog = 0
}

// Mock for window.prompt
const mockPrompt = (message, defaultValue = '') => {
  callCounts.prompt++
  const response = promptResponses.shift() || defaultValue
  consoleMessages.push(`PROMPT: ${message}`)
  return response
}

// Mock for window.alert
const mockAlert = message => {
  callCounts.alert++
  alertMessages.push(message)
  consoleMessages.push(`ALERT: ${message}`)
}

// Mock for console.log
const mockConsoleLog = (...args) => {
  callCounts.consoleLog++
  const message = args.join(' ')
  consoleMessages.push(message)
}

// Set up prompt responses for a test
const setPromptResponses = responses => {
  promptResponses.push(...responses)
}

// Get recorded information
const getAlertMessages = () => [...alertMessages]
const getConsoleMessages = () => [...consoleMessages]
const getCallCounts = () => ({...callCounts})

export {
  mockPrompt,
  mockAlert,
  mockConsoleLog,
  resetMocks,
  setPromptResponses,
  getAlertMessages,
  getConsoleMessages,
  getCallCounts
} 