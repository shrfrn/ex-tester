import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { testExercise } from '../src/testRunner.js'
import { mockPrompt, mockAlert, resetMocks } from '../src/mockBrowser.js'

// Mock fs.readFileSync
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}))

describe('Test Runner', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    resetMocks()
  })
  
  test('should correctly evaluate a passing exercise', async () => {
    // Mock a simple exercise that should pass
    const mockCode = `
      // A simple exercise to calculate the sum of two numbers
      const num1 = prompt('Enter the first number:')
      const num2 = prompt('Enter the second number:')
      
      const sum = Number(num1) + Number(num2)
      
      console.log('The sum is: ' + sum)
      alert('The result is: ' + sum)
    `
    
    // Set up the mock to return our test code
    fs.readFileSync.mockReturnValue(mockCode)
    
    // Define expected behavior
    const expectedBehavior = {
      inputs: ['5', '10'],
      outputs: ['The sum is: 15', 'The result is: 15']
    }
    
    // Run the test
    const result = await testExercise('fake/path/exercise.js', expectedBehavior)
    
    // Verify the results
    expect(result.runs).toBe(true)
    expect(result.correct).toBe(true)
    expect(result.errorMessage).toBeNull()
  })
  
  test('should correctly identify a failing exercise', async () => {
    // Mock an exercise with an error
    const mockCode = `
      // Exercise with a syntax error
      const num1 = prompt('Enter the first number:')
      const num2 = prompt('Enter the second number:')
      
      // This is a deliberate error - missing closing parenthesis
      const sum = Number(num1 + Number(num2)
      
      console.log('The sum is: ' + sum)
    `
    
    // Set up the mock to return our test code
    fs.readFileSync.mockReturnValue(mockCode)
    
    // Define expected behavior
    const expectedBehavior = {
      inputs: ['5', '10'],
      outputs: ['The sum is: 15']
    }
    
    // Run the test
    const result = await testExercise('fake/path/exercise.js', expectedBehavior)
    
    // Verify the results
    expect(result.runs).toBe(false)
    expect(result.correct).toBe(false)
    expect(result.errorMessage).not.toBeNull()
  })
  
  test('should correctly evaluate incorrect output', async () => {
    // Mock an exercise that runs but produces incorrect output
    const mockCode = `
      // A simple exercise that calculates the difference instead of sum
      const num1 = prompt('Enter the first number:')
      const num2 = prompt('Enter the second number:')
      
      // This is wrong - should be addition
      const result = Number(num1) - Number(num2)
      
      console.log('The sum is: ' + result)
    `
    
    // Set up the mock to return our test code
    fs.readFileSync.mockReturnValue(mockCode)
    
    // Define expected behavior
    const expectedBehavior = {
      inputs: ['15', '5'],
      outputs: ['The sum is: 20']
    }
    
    // Run the test
    const result = await testExercise('fake/path/exercise.js', expectedBehavior)
    
    // Verify the results
    expect(result.runs).toBe(true)
    expect(result.correct).toBe(false) // Output is incorrect
    expect(result.errorMessage).toBeNull()
  })
}) 