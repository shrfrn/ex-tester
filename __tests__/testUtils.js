import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages } from '../src/mockBrowser.js'

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
  
  // Execute the code
  try {
    const script = new vm.Script(code)
    const context = vm.createContext(sandbox)
    script.runInContext(context)
    
    return {
      success: true,
      consoleOutput: getConsoleMessages(),
      alertOutput: getAlertMessages(),
      allOutput: [...getConsoleMessages(), ...getAlertMessages()]
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      consoleOutput: getConsoleMessages(),
      alertOutput: getAlertMessages(),
      allOutput: [...getConsoleMessages(), ...getAlertMessages()]
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

export {
  runCode,
  outputContains,
  outputMatches,
  outputContainsAll,
  outputContainsNumber
} 