import { runScript, runFunction, hasFunctionWithSignature, checkReturnValueType } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that generatePass function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('generatePass', 1)
    checkAndRecord('Function generatePass is defined correctly with 1 parameter', functionExists, 20)

    // Define test cases for different password lengths
    const testCases = [
        { input: [8], description: 'Generates a password of length 8', points: 10 },
        { input: [12], description: 'Generates a password of length 12', points: 10 },
        { input: [16], description: 'Generates a password of length 16', points: 10 },
        { input: [1], description: 'Handles minimum length of 1', points: 10 },
        { input: [32], description: 'Handles longer passwords (length 32)', points: 10 }
    ]

    // Function to check if the password contains only valid characters (digits and letters)
    const isValidPassword = (password) => {
        return /^[a-zA-Z0-9]+$/.test(password)
    }

    // Test for the specified lengths
    testCases.forEach(testCase => {
        const length = testCase.input[0]
        
        // Only run the function if it exists, otherwise store null result
        const testResult = functionExists 
            ? runFunction('generatePass', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'string')) return false
            
            return testResult.returnValue.length === length
        }, testCase.points)
    
        // Test for valid characters
        checkAndRecord('Password contains only valid characters (letters and digits)', () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'string')) return false
            
            return isValidPassword(testResult.returnValue) 
        }, 10)
    })

    // Test for randomness (run multiple times and check for differences)
    checkAndRecord('Passwords are random (different on each call)', () => {
        if (!functionExists) return false
        
        const passwords = []
        const passWordCount = 10

        // Generate multiple passwords
        for (let i = 0; i < passWordCount; i++) {
            const testResult = runFunction('generatePass', [10])
            if (testResult.success && checkReturnValueType(testResult.returnValue, 'string')) {
                passwords.push(testResult.returnValue)
            }
        }
        
        // Convert passwords to a Set to get unique values
        const uniquePasswords = new Set(passwords)
        return uniquePasswords.size === passWordCount
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 