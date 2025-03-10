import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { runCode, outputContains, outputContainsAll, analyzeCode } from './testUtils.js'

describe('Exercise 01 - Full Name Greeting', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })
  
  // Add diagnostic test to verify file access
  test('should be able to read the student file correctly', () => {
    // Get the student file path from environment variable or use default path
    const studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
    
    // Inform about which file is being tested
    console.log(`Testing file: ${studentFilePath}`)
    
    // Read the file
    const code = fs.readFileSync(studentFilePath, 'utf8')
    
    // Verify file contains expected content
    expect(code).toBeTruthy()
    
    // Print the last 100 characters to verify the alert is there
    const lastPart = code.slice(-100)
    console.log(`Last part of file: ${lastPart}`)
    
    // Check for both console.log and alert usage
    const hasConsoleLog = code.includes('console.log')
    const hasAlert = code.includes('alert(')
    
    console.log(`File contains console.log: ${hasConsoleLog}`)
    console.log(`File contains alert(): ${hasAlert}`)
  })
  
  test('should prompt for first and last name and display full name greeting', () => {
    // Get the student file path from environment variable or use default path
    const studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
    
    // Read the actual student's code file
    const code = fs.readFileSync(studentFilePath, 'utf8')
    
    // Test with sample name input
    const firstName = 'John'
    const lastName = 'Smith'
    const result = runCode(code, [firstName, lastName])
    
    // Verify code executed successfully
    expect(result.success).toBe(true)
    
    // CRITICAL: Verify prompt was actually called at least twice
    expect(result.callCounts.prompt).toBeGreaterThanOrEqual(2, 
      'prompt() must be called at least twice to get first and last name')
    
    // Check that the variables were declared and used
    expect(result.variables.declared).toContain('fullName', 
      'A variable named fullName must be declared')
    
    // Check if alert or console.log was used to display output
    expect(result.callCounts.alert + result.callCounts.consoleLog).toBeGreaterThan(0,
      'Output must be displayed using alert() or console.log()')
    
    // Output should contain both first and last name
    expect(outputContains(result.allOutput, firstName)).toBe(true,
      'Output must contain the first name')
    expect(outputContains(result.allOutput, lastName)).toBe(true,
      'Output must contain the last name')
    
    // Output should contain both names and at least one additional word (greeting)
    const fullNameOutput = result.allOutput.some(output => {
      const containsFirstName = output.includes(firstName)
      const containsLastName = output.includes(lastName)
      const hasAdditionalWord = output.split(/\s+/).length > 2
      return containsFirstName && containsLastName && hasAdditionalWord
    })
    
    expect(fullNameOutput).toBe(true, 
      'Output must contain both first and last name with at least one additional word')
  })
  
  test('should work with different name inputs', () => {
    // Get the student file path from environment variable or use default path
    const studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
    
    // Read the actual student's code file
    const code = fs.readFileSync(studentFilePath, 'utf8')
    
    // Test with different name inputs
    const testCases = [
      ['Alice', 'Johnson'],
      ['María', 'García'],
      ['Alex', 'Smith-Johnson']
    ]
    
    // Track outputs to verify they change with different inputs
    const allOutputs = new Set()
    
    for (const [firstName, lastName] of testCases) {
      const result = runCode(code, [firstName, lastName])
      
      // Verify code executed successfully
      expect(result.success).toBe(true)
      
      // CRITICAL: Verify prompt was actually called
      expect(result.callCounts.prompt).toBeGreaterThanOrEqual(2)
      
      // Output should contain both names
      expect(outputContains(result.allOutput, firstName)).toBe(true)
      expect(outputContains(result.allOutput, lastName)).toBe(true)
      
      // Add output to set for uniqueness checking
      allOutputs.add(JSON.stringify(result.allOutput))
    }
    
    // Outputs should be different for different inputs
    // This proves the code actually uses the input values
    expect(allOutputs.size).toBeGreaterThan(1,
      'Output must change when different names are provided')
  })
  
  test('should use variables correctly to build the full name', () => {
    // Get the student file path from environment variable or use default path
    const studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
    
    // Read the actual student's code file
    const code = fs.readFileSync(studentFilePath, 'utf8')
    
    // Check if code uses variables to store names
    expect(code).toMatch(/(let|const|var)[\s\S]*?=[\s\S]*?prompt/)
    
    // Run the code and verify variable usage
    const result = runCode(code, ['John', 'Doe'])
    expect(result.success).toBe(true)
    
    // Check for the required fullName variable
    expect(result.variables.declared).toContain('fullName', 
      'A variable named fullName must be declared')
    expect(result.variables.accessed).toContain('fullName', 
      'The fullName variable must be used after being declared')
    
    // Make sure the full name is constructed correctly
    const fullNameOutput = result.allOutput.some(output => 
      output.includes('John Doe'))
    expect(fullNameOutput).toBe(true, 
      'Output must include the full name (first + last)')
  })
}) 