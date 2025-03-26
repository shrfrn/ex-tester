// Mock implementations for browser functions

// Store prompt responses for verification
const promptResponses = []
const alertMessages = []
const consoleMessages = []
const consoleTables = []

// Track function call counts
const callCounts = {
  prompt: 0,
  alert: 0,
  consoleLog: 0,
  consoleTable: 0,
  setInterval: 0,
  clearInterval: 0,
  intervalCallbacks: {} // Track callback invocations per interval
}

// For tracking intervals
const intervals = {}
let nextIntervalId = 1
let currentTime = 0

// Reset all stored messages/responses and call counts
const resetMocks = () => {
  promptResponses.length = 0
  alertMessages.length = 0
  consoleMessages.length = 0
  consoleTables.length = 0
  
  // Reset call counts
  callCounts.prompt = 0
  callCounts.alert = 0
  callCounts.consoleLog = 0
  callCounts.consoleTable = 0
  callCounts.setInterval = 0
  callCounts.clearInterval = 0
  callCounts.intervalCallbacks = {}
  
  // Reset intervals
  Object.keys(intervals).forEach(id => delete intervals[id])
  nextIntervalId = 1
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

// Mock for console.table
const mockConsoleTable = (data) => {
  callCounts.consoleTable++
  consoleTables.push(data)
  consoleMessages.push(`TABLE: ${JSON.stringify(data)}`)
}

// Mock for setInterval
const mockSetInterval = (callback, delay) => {
  callCounts.setInterval++
  const id = nextIntervalId++
  
  // Initialize callback count for this interval
  callCounts.intervalCallbacks[id] = 0
  
  // Create a function that runs the callback and reschedules itself
  const runCallback = () => {
    if (intervals[id]?.isActive) {
      callCounts.intervalCallbacks[id]++
      callback()
      // Reschedule the callback using setImmediate
      setImmediate(runCallback)
    }
  }
  
  intervals[id] = {
    callback: runCallback,
    delay,
    isActive: true
  }
  
  // Start the first callback immediately
  setImmediate(runCallback)
  
  return id
}

// Mock for clearInterval
const mockClearInterval = (id) => {
  callCounts.clearInterval++
  if (intervals[id]) {
    intervals[id].isActive = false
  }
}

// Get all active interval IDs
const getActiveIntervalIds = () => {
  return Object.keys(intervals)
    .filter(id => intervals[id].isActive)
    .map(id => parseInt(id))
}

// Set up prompt responses for a test
const setPromptResponses = responses => {
  promptResponses.push(...responses)
}

// Get recorded information
const getAlertMessages = () => [...alertMessages]
const getConsoleMessages = () => [...consoleMessages]
const getConsoleTables = () => [...consoleTables]
const getCallCounts = () => ({...callCounts})

export {
  mockPrompt,
  mockAlert,
  mockConsoleLog,
  mockConsoleTable,
  mockSetInterval,
  mockClearInterval,
  getActiveIntervalIds,
  resetMocks,
  setPromptResponses,
  getAlertMessages,
  getConsoleMessages,
  getConsoleTables,
  getCallCounts
} 