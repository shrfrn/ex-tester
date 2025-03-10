// Mock implementations for browser functions

// Store prompt responses for verification
const promptResponses = []
const alertMessages = []
const consoleMessages = []

// Reset all stored messages/responses
const resetMocks = () => {
  promptResponses.length = 0
  alertMessages.length = 0
  consoleMessages.length = 0
}

// Mock for window.prompt
const mockPrompt = (message, defaultValue = '') => {
  const response = promptResponses.shift() || defaultValue
  consoleMessages.push(`PROMPT: ${message}`)
  return response
}

// Mock for window.alert
const mockAlert = message => {
  alertMessages.push(message)
  consoleMessages.push(`ALERT: ${message}`)
}

// Mock for console.log
const mockConsoleLog = (...args) => {
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

export {
  mockPrompt,
  mockAlert,
  mockConsoleLog,
  resetMocks,
  setPromptResponses,
  getAlertMessages,
  getConsoleMessages
} 