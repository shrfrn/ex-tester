import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { runCode, outputContains, outputContainsAll } from './testUtils.js'

describe('Exercise 01 - Full Name Greeting', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })
  
  test('should prompt for first and last name and display full name greeting', () => {
    // Read the actual student's code file
    const code = fs.readFileSync(path.join(process.cwd(), '01.js'), 'utf8')
    
    // Test with sample name input
    const firstName = 'John'
    const lastName = 'Smith'
    const result = runCode(code, [firstName, lastName])
    
    // Verify code executed successfully
    expect(result.success).toBe(true)
    
    // Check if prompt was used twice for input
    const promptCalls = result.consoleOutput.filter(output => 
      output.startsWith('PROMPT:')
    )
    expect(promptCalls.length).toBeGreaterThanOrEqual(2)
    
    // Check if alert or console.log was used to display output
    expect(result.allOutput.length).toBeGreaterThan(promptCalls.length)
    
    // Output should contain both first and last name
    expect(outputContains(result.allOutput, firstName)).toBe(true)
    expect(outputContains(result.allOutput, lastName)).toBe(true)
    
    // Output should contain both names and at least one additional word (greeting)
    const fullNameOutput = result.allOutput.some(output => {
      const containsFirstName = output.includes(firstName)
      const containsLastName = output.includes(lastName)
      const hasAdditionalWord = output.split(/\s+/).length > 2
      return containsFirstName && containsLastName && hasAdditionalWord
    })
    
    expect(fullNameOutput).toBe(true)
  })
  
  test('should work with different name inputs', () => {
    // Read the actual student's code file
    const code = fs.readFileSync(path.join(process.cwd(), '01.js'), 'utf8')
    
    // Test with different name inputs
    const testCases = [
      ['Alice', 'Johnson'],
      ['María', 'García'],
      ['Alex', 'Smith-Johnson']
    ]
    
    for (const [firstName, lastName] of testCases) {
      const result = runCode(code, [firstName, lastName])
      
      // Verify code executed successfully
      expect(result.success).toBe(true)
      
      // Output should contain both names
      expect(outputContains(result.allOutput, firstName)).toBe(true)
      expect(outputContains(result.allOutput, lastName)).toBe(true)
    }
  })
  
  test('should store names and use them in output', () => {
    // Read the actual student's code file
    const code = fs.readFileSync(path.join(process.cwd(), '01.js'), 'utf8')
    
    // Check if code uses variables to store names
    expect(code).toMatch(/(let|const|var)[\s\S]*?=[\s\S]*?prompt/)
    
    // Check if the fullName variable is declared
    expect(code).toMatch(/(let|const|var)[\s\S]*?fullName/)
    
    // Run the code and verify output
    const result = runCode(code, ['John', 'Doe'])
    expect(result.success).toBe(true)
  })
}) 