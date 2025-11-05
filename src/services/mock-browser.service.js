// Mock implementations for browser functions

// Store prompt responses for verification
const promptResponses = []
const confirmResponses = []
const alertMessages = []
const consoleMessages = []
const consoleTables = []
const consoleWarnings = []
const consoleErrors = []
const consoleGroups = []

// Track function call counts
const callCounts = {
  prompt: 0,
  confirm: 0,
  alert: 0,
  consoleLog: 0,
  consoleTable: 0,
  consoleWarn: 0,
  consoleError: 0,
  consoleInfo: 0,
  consoleDebug: 0,
  consoleGroup: 0,
  consoleGroupCollapsed: 0,
  consoleGroupEnd: 0,
  consoleAssert: 0,
  consoleClear: 0,
  consoleDir: 0,
  consoleDirxml: 0,
  consoleTrace: 0,
  consoleCount: 0,
  consoleCountReset: 0,
  consoleTime: 0,
  consoleTimeEnd: 0,
  consoleTimeLog: 0,
  setInterval: 0,
  clearInterval: 0,
  setTimeout: 0,
  clearTimeout: 0,
  intervalCallbacks: {}, // Track callback invocations per interval
  timeoutCallbacks: {} // Track callback invocations per timeout
}

// For tracking intervals and timeouts
const intervals = {}
const timeouts = {}
let nextIntervalId = 1
let nextTimeoutId = 1
let currentGroupDepth = 0

// Reset all stored messages/responses and call counts
const resetMocks = () => {
  // Reset all message arrays
  promptResponses.length = 0
  confirmResponses.length = 0
  alertMessages.length = 0
  consoleMessages.length = 0
  consoleTables.length = 0
  consoleWarnings.length = 0
  consoleErrors.length = 0
  consoleGroups.length = 0
  
  // Reset all call counts
  Object.keys(callCounts).forEach(key => {
    const value = callCounts[key]
    callCounts[key] = typeof value === 'object' ? {} : 0
  })
  
  // Clear and reset intervals
  Object.keys(intervals).forEach(id => {
    if (intervals[id].nodeIntervalId) {
      clearInterval(intervals[id].nodeIntervalId)
    }
    delete intervals[id]
  })
  
  // Clear and reset timeouts
  Object.keys(timeouts).forEach(id => {
    if (timeouts[id].nodeTimeoutId) {
      clearTimeout(timeouts[id].nodeTimeoutId)
    }
    delete timeouts[id]
  })
  
  nextIntervalId = 1
  nextTimeoutId = 1
  currentGroupDepth = 0
}

// Mock for window.prompt
const mockPrompt = (message, defaultValue = '') => {
  callCounts.prompt++
  const response = promptResponses.shift() || defaultValue
  consoleMessages.push(`PROMPT: ${message}`)
  return response
}

// Mock for window.confirm
const mockConfirm = message => {
  callCounts.confirm++
  const response = confirmResponses.shift()
  const result = response !== undefined ? response : true
  consoleMessages.push(`CONFIRM: ${message}`)
  return result
}

// Mock for window.alert
const mockAlert = message => {
  callCounts.alert++
  const stringMessage = String(message)
  alertMessages.push(stringMessage)
  consoleMessages.push(`ALERT: ${stringMessage}`)
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

// Mock for console.warn
const mockConsoleWarn = (...args) => {
  callCounts.consoleWarn++
  const message = args.join(' ')
  consoleWarnings.push(message)
  consoleMessages.push(`WARN: ${message}`)
}

// Mock for console.error
const mockConsoleError = (...args) => {
  callCounts.consoleError++
  const message = args.join(' ')
  consoleErrors.push(message)
  consoleMessages.push(`ERROR: ${message}`)
}

// Mock for console.info
const mockConsoleInfo = (...args) => {
  callCounts.consoleInfo++
  const message = args.join(' ')
  consoleMessages.push(`INFO: ${message}`)
}

// Mock for console.debug
const mockConsoleDebug = (...args) => {
  callCounts.consoleDebug++
  const message = args.join(' ')
  consoleMessages.push(`DEBUG: ${message}`)
}

// Mock for console.group
const mockConsoleGroup = (...args) => {
  callCounts.consoleGroup++
  const label = args.length > 0 ? args.join(' ') : 'console.group'
  consoleGroups.push({ type: 'group', label, depth: currentGroupDepth })
  consoleMessages.push(`${'  '.repeat(currentGroupDepth)}GROUP: ${label}`)
  currentGroupDepth++
}

// Mock for console.groupCollapsed
const mockConsoleGroupCollapsed = (...args) => {
  callCounts.consoleGroupCollapsed++
  const label = args.length > 0 ? args.join(' ') : 'console.groupCollapsed'
  consoleGroups.push({ type: 'groupCollapsed', label, depth: currentGroupDepth })
  consoleMessages.push(`${'  '.repeat(currentGroupDepth)}GROUP_COLLAPSED: ${label}`)
  currentGroupDepth++
}

// Mock for console.groupEnd
const mockConsoleGroupEnd = () => {
  callCounts.consoleGroupEnd++
  if (currentGroupDepth > 0) {
    currentGroupDepth--
  }
  consoleMessages.push(`${'  '.repeat(currentGroupDepth)}GROUP_END`)
}

// Mock for console.assert
const mockConsoleAssert = (assertion, ...args) => {
  callCounts.consoleAssert++
  if (!assertion) {
    const message = args.length > 0 ? args.join(' ') : 'Assertion failed'
    consoleErrors.push(message)
    consoleMessages.push(`ASSERT: ${message}`)
  }
}

// Mock for console.clear
const mockConsoleClear = () => {
  callCounts.consoleClear++
  consoleMessages.push('CONSOLE_CLEARED')
}

// Mock for console.dir
const mockConsoleDir = (obj, options) => {
  callCounts.consoleDir++
  consoleMessages.push(`DIR: ${JSON.stringify(obj)}`)
}

// Mock for console.dirxml
const mockConsoleDirxml = (...args) => {
  callCounts.consoleDirxml++
  const message = args.join(' ')
  consoleMessages.push(`DIRXML: ${message}`)
}

// Mock for console.trace
const mockConsoleTrace = (...args) => {
  callCounts.consoleTrace++
  const message = args.length > 0 ? args.join(' ') : 'console.trace'
  consoleMessages.push(`TRACE: ${message}`)
}

// Mock for console.count
const consoleCounters = {}
const mockConsoleCount = (label = 'default') => {
  callCounts.consoleCount++
  consoleCounters[label] = (consoleCounters[label] || 0) + 1
  consoleMessages.push(`COUNT(${label}): ${consoleCounters[label]}`)
}

// Mock for console.countReset
const mockConsoleCountReset = (label = 'default') => {
  callCounts.consoleCountReset++
  consoleCounters[label] = 0
  consoleMessages.push(`COUNT_RESET(${label})`)
}

// Mock for console.time
const consoleTimers = {}
const mockConsoleTime = (label = 'default') => {
  callCounts.consoleTime++
  consoleTimers[label] = Date.now()
  consoleMessages.push(`TIME_START(${label})`)
}

// Mock for console.timeEnd
const mockConsoleTimeEnd = (label = 'default') => {
  callCounts.consoleTimeEnd++
  if (consoleTimers[label]) {
    const elapsed = Date.now() - consoleTimers[label]
    consoleMessages.push(`TIME_END(${label}): ${elapsed}ms`)
    delete consoleTimers[label]
  } else {
    consoleMessages.push(`TIME_END(${label}): Timer does not exist`)
  }
}

// Mock for console.timeLog
const mockConsoleTimeLog = (label = 'default', ...args) => {
  callCounts.consoleTimeLog++
  if (consoleTimers[label]) {
    const elapsed = Date.now() - consoleTimers[label]
    const message = args.length > 0 ? ` ${args.join(' ')}` : ''
    consoleMessages.push(`TIME_LOG(${label}): ${elapsed}ms${message}`)
  } else {
    consoleMessages.push(`TIME_LOG(${label}): Timer does not exist`)
  }
}

// Mock for setInterval
// NOTE: This uses actual Node.js setInterval with a fast-forward delay (1ms)
// to allow tests to run quickly while avoiding infinite loop issues.
// The delay parameter is stored for reference but actual timing uses 1ms.
const mockSetInterval = (callback, delay) => {
  callCounts.setInterval++
  const id = nextIntervalId++
  
  // Initialize callback count for this interval
  callCounts.intervalCallbacks[id] = 0
  
  // Safeguard: limit callback invocations to prevent runaway intervals
  const MAX_CALLBACK_INVOCATIONS = 1000
  
  // Wrap callback with safeguard and tracking
  const wrappedCallback = () => {
    if (!intervals[id]?.isActive) return
    
    callCounts.intervalCallbacks[id]++
    
    // Safeguard: stop if we've exceeded max invocations
    if (callCounts.intervalCallbacks[id] > MAX_CALLBACK_INVOCATIONS) {
      mockClearInterval(id)
      console.warn(`Interval ${id} stopped after ${MAX_CALLBACK_INVOCATIONS} invocations to prevent runaway execution`)
      return
    }
    
    callback()
  }
  
  // Use actual Node.js setInterval with fast-forward delay (1ms)
  const nodeIntervalId = setInterval(wrappedCallback, 1)
  
  intervals[id] = {
    nodeIntervalId,
    delay,
    isActive: true,
  }
  
  return id
}

// Mock for clearInterval
const mockClearInterval = (id) => {
  callCounts.clearInterval++
  
  if (intervals[id]) {
    intervals[id].isActive = false
    
    // Clear the actual Node.js interval
    if (intervals[id].nodeIntervalId) {
      clearInterval(intervals[id].nodeIntervalId)
    }
  }
}

// Mock for setTimeout
// NOTE: This uses actual Node.js setTimeout with a fast-forward delay (1ms)
// to allow tests to run quickly while maintaining proper async behavior.
// The delay parameter is stored for reference but actual timing uses 1ms.
const mockSetTimeout = (callback, delay) => {
  callCounts.setTimeout++
  const id = nextTimeoutId++
  
  // Initialize callback count for this timeout
  callCounts.timeoutCallbacks[id] = 0
  
  // Wrap callback with tracking
  const wrappedCallback = () => {
    if (!timeouts[id]?.isActive) return
    
    callCounts.timeoutCallbacks[id]++
    callback()
    timeouts[id].isActive = false
  }
  
  // Use actual Node.js setTimeout with fast-forward delay (1ms)
  const nodeTimeoutId = setTimeout(wrappedCallback, 1)
  
  timeouts[id] = {
    nodeTimeoutId,
    delay,
    isActive: true,
  }
  
  return id
}

// Mock for clearTimeout
const mockClearTimeout = (id) => {
  callCounts.clearTimeout++
  
  if (timeouts[id]) {
    timeouts[id].isActive = false
    
    // Clear the actual Node.js timeout
    if (timeouts[id].nodeTimeoutId) {
      clearTimeout(timeouts[id].nodeTimeoutId)
    }
  }
}

// Get all active interval IDs
const getActiveIntervalIds = () => {
  return Object.keys(intervals)
    .filter(id => intervals[id].isActive)
    .map(id => parseInt(id))
}

// Get all active timeout IDs
const getActiveTimeoutIds = () => {
  return Object.keys(timeouts)
    .filter(id => timeouts[id].isActive)
    .map(id => parseInt(id))
}

// Set up prompt responses for a test
const setPromptResponses = responses => {
  promptResponses.push(...responses)
}

// Set up confirm responses for a test
const setConfirmResponses = responses => {
  confirmResponses.push(...responses)
}

// Get recorded information
const getAlertMessages = () => [...alertMessages]
const getConsoleMessages = () => [...consoleMessages]
const getConsoleTables = () => [...consoleTables]
const getConsoleWarnings = () => [...consoleWarnings]
const getConsoleErrors = () => [...consoleErrors]
const getConsoleGroups = () => [...consoleGroups]

// Get call counts for all mocked functions
// Returns an object with:
// - Primitive counts (e.g., prompt: 5, consoleLog: 10)
// - intervalCallbacks: object mapping interval IDs to invocation counts
// - timeoutCallbacks: object mapping timeout IDs to invocation counts
const getCallCounts = () => ({...callCounts})

export {
    mockPrompt,
    mockConfirm,
    mockAlert,
    mockConsoleLog,
    mockConsoleTable,
    mockConsoleWarn,
    mockConsoleError,
    mockConsoleInfo,
    mockConsoleDebug,
    mockConsoleGroup,
    mockConsoleGroupCollapsed,
    mockConsoleGroupEnd,
    mockConsoleAssert,
    mockConsoleClear,
    mockConsoleDir,
    mockConsoleDirxml,
    mockConsoleTrace,
    mockConsoleCount,
    mockConsoleCountReset,
    mockConsoleTime,
    mockConsoleTimeEnd,
    mockConsoleTimeLog,
    mockSetInterval,
    mockClearInterval,
    mockSetTimeout,
    mockClearTimeout,
    getActiveIntervalIds,
    getActiveTimeoutIds,
    resetMocks,
    setPromptResponses,
    setConfirmResponses,
    getAlertMessages,
    getConsoleMessages,
    getConsoleTables,
    getConsoleWarnings,
    getConsoleErrors,
    getConsoleGroups,
    getCallCounts
} 