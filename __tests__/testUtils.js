import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getCallCounts } from '../src/mockBrowser.js'

// Run a student's code in a sandbox environment
const runCode = (code, inputs = []) => {
  resetMocks()
  setPromptResponses(inputs)
  
  // Create sandbox with mocked browser functions
  const sandbox = {
    console: { log: mockConsoleLog },
    alert: mockAlert,
    prompt: mockPrompt,
    document: {},
    window: {}
  }
  
  // Add global object references
  sandbox.global = sandbox
  sandbox.window.document = sandbox.document
  
  // Setup variable tracking
  const declaredVariables = new Set()
  const accessedVariables = new Set()
  
  // Track variable usage through proxies
  const originalDefineProperty = Object.defineProperty
  sandbox.Object = {
    ...Object,
    defineProperty: function(obj, prop, descriptor) {
      if (obj === sandbox && typeof prop === 'string') {
        declaredVariables.add(prop)
      }
      return originalDefineProperty(obj, prop, descriptor)
    }
  }
  
  // Create a handler for the vm context
  const handler = {
    get: function(target, prop) {
      if (typeof prop === 'string' && !prop.startsWith('_') && 
          !['console', 'alert', 'prompt', 'document', 'window'].includes(prop)) {
        accessedVariables.add(prop)
      }
      return target[prop]
    },
    set: function(target, prop, value) {
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        declaredVariables.add(prop)
      }
      target[prop] = value
      return true
    }
  }
  
  // Execute the code
  try {
    const script = new vm.Script(code)
    const context = vm.createContext(new Proxy(sandbox, handler))
    script.runInContext(context)
    
    return {
      success: true,
      consoleOutput: getConsoleMessages(),
      alertOutput: getAlertMessages(),
      allOutput: [...getConsoleMessages(), ...getAlertMessages()],
      callCounts: getCallCounts(),
      variables: {
        declared: Array.from(declaredVariables),
        accessed: Array.from(accessedVariables)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      consoleOutput: getConsoleMessages(),
      alertOutput: getAlertMessages(),
      allOutput: [...getConsoleMessages(), ...getAlertMessages()],
      callCounts: getCallCounts(),
      variables: {
        declared: Array.from(declaredVariables),
        accessed: Array.from(accessedVariables)
      }
    }
  }
}

// Check if any output contains text (case insensitive, flexible matching)
const outputContains = (outputs, text) => {
  const lowerText = text.toLowerCase()
  return outputs.some(output => 
    output.toLowerCase().includes(lowerText)
  )
}

// Check if any output matches a regular expression pattern
const outputMatches = (outputs, pattern) => {
  return outputs.some(output => pattern.test(output))
}

// Check if outputs contain all required texts (with flexible matching)
const outputContainsAll = (outputs, requiredTexts) => {
  return requiredTexts.every(text => outputContains(outputs, text))
}

// Check if output contains any number close to the expected value (within tolerance)
const outputContainsNumber = (outputs, expectedNumber, tolerance = 0.01) => {
  // Extract all numbers from outputs
  const numbers = []
  outputs.forEach(output => {
    const matches = output.match(/-?\d+(\.\d+)?/g)
    if (matches) {
      matches.forEach(match => numbers.push(parseFloat(match)))
    }
  })
  
  return numbers.some(number => 
    Math.abs(number - expectedNumber) <= tolerance
  )
}

// Analyze code for potential issues like commented-out code
const analyzeCode = (code) => {
  // Count lines of code
  const lines = code.split('\n')
  const totalLines = lines.length
  
  // Count commented lines
  const commentedLines = lines.filter(line => 
    line.trim().startsWith('//') || 
    line.trim().startsWith('/*') || 
    line.trim().startsWith('*') || 
    line.trim().startsWith('*/')
  ).length
  
  // Count non-empty, non-comment lines
  const activeCodeLines = lines.filter(line => {
    const trimmed = line.trim()
    return trimmed && 
      !trimmed.startsWith('//') && 
      !trimmed.startsWith('/*') && 
      !trimmed.startsWith('*') && 
      !trimmed.startsWith('*/')
  }).length
  
  // Detect multi-line comment blocks
  let inCommentBlock = false
  let multiLineCommentCount = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (!inCommentBlock && trimmed.includes('/*')) {
      inCommentBlock = true
      multiLineCommentCount++
    }
    
    if (inCommentBlock && trimmed.includes('*/')) {
      inCommentBlock = false
    }
  }
  
  // Check for commented-out function calls
  const commentedFunctionCalls = {
    prompt: (code.match(/\/\/.*prompt\s*\(/g) || []).length + 
           (code.match(/\/\*[\s\S]*?prompt\s*\([\s\S]*?\*\//g) || []).length,
    alert: (code.match(/\/\/.*alert\s*\(/g) || []).length + 
           (code.match(/\/\*[\s\S]*?alert\s*\([\s\S]*?\*\//g) || []).length,
    console: (code.match(/\/\/.*console\.log\s*\(/g) || []).length + 
           (code.match(/\/\*[\s\S]*?console\.log\s*\([\s\S]*?\*\//g) || []).length
  }
  
  return {
    totalLines,
    commentedLines,
    activeCodeLines,
    commentedToActiveRatio: commentedLines / (activeCodeLines || 1),
    multiLineCommentBlocks: multiLineCommentCount,
    commentedFunctionCalls,
    potentialIssues: {
      mostlyComments: commentedLines > activeCodeLines,
      commentedRequiredFunctions: commentedFunctionCalls.prompt > 0 || 
                                 commentedFunctionCalls.alert > 0
    }
  }
}

export {
  runCode,
  outputContains,
  outputMatches,
  outputContainsAll,
  outputContainsNumber,
  analyzeCode
} 