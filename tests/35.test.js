// In the current testing scheme, bonuses are not well supported.
// Consider making the encript() bonus mandatory

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

    // Check for all required functions
    const encryptExists = hasFunctionWithSignature('encrypt', 1)
    const decryptExists = hasFunctionWithSignature('decrypt', 1)
    const encodeExists = hasFunctionWithSignature('encode', 2) // Bonus function

    // Check required functions existence
    checkAndRecord('Function encrypt is defined correctly with 1 parameter', () => {
        return encryptExists
    }, 10)

    checkAndRecord('Function decrypt is defined correctly with 1 parameter', () => {
        return decryptExists
    }, 10)

    checkAndRecord('Bonus: Function encode is defined correctly with 2 parameters', () => {
        return encodeExists
    }, 20)

    // Define test cases for encryption
    const encryptionTestCases = [
        { 
            input: ["ABC"], 
            expected: "FGH", 
            description: 'Correctly encrypts "ABC" to "FGH"', 
            points: 10 
        },
        { 
            input: ["Hello"], 
            expected: "Mjqqt", 
            description: 'Correctly encrypts "Hello" to "Mjqqt"', 
            points: 10 
        },
        { 
            input: ["xyz"], 
            expected: "|}~", 
            description: 'Correctly encrypts "xyz" to "|}~"', 
            points: 10 
        },
        { 
            input: [""], 
            expected: "", 
            description: 'Correctly handles empty string encryption', 
            points: 10 
        }
    ]

    // Run encryption test cases
    if (encryptExists) {
        encryptionTestCases.forEach(testCase => {
            const testResult = runFunction('encrypt', testCase.input)
            
            checkAndRecord(testCase.description, () => {
                if (!testResult.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(testResult.returnValue, 'string')) return false
                
                return testResult.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        encryptionTestCases.forEach(testCase => {
            checkAndRecord(testCase.description, () => false, testCase.points)
        })
    }

    // Define test cases for decryption
    const decryptionTestCases = [
        { 
            input: ["FGH"], 
            expected: "ABC", 
            description: 'Correctly decrypts "FGH" to "ABC"', 
            points: 10 
        },
        { 
            input: ["Mjqqt"], 
            expected: "Hello", 
            description: 'Correctly decrypts "Mjqqt" to "Hello"', 
            points: 10 
        },
        { 
            input: ["|}~"], 
            expected: "xyz", 
            description: 'Correctly decrypts "|}~" to "xyz"', 
            points: 10 
        },
        { 
            input: [""], 
            expected: "", 
            description: 'Correctly handles empty string decryption', 
            points: 10 
        }
    ]

    // Run decryption test cases
    if (decryptExists) {
        decryptionTestCases.forEach(testCase => {
            const testResult = runFunction('decrypt', testCase.input)
            
            checkAndRecord(testCase.description, () => {
                if (!testResult.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(testResult.returnValue, 'string')) return false
                
                return testResult.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        decryptionTestCases.forEach(testCase => {
            checkAndRecord(testCase.description, () => false, testCase.points)
        })
    }

    // Define round-trip test cases
    const roundTripTestCases = [
        { 
            input: "JavaScript", 
            description: 'Round-trip encryption and decryption of "JavaScript" returns the original string', 
            points: 10 
        },
        { 
            input: "Hello World!", 
            description: 'Round-trip encryption and decryption of "Hello World!" returns the original string', 
            points: 10 
        }
    ]

    // Test round-trip encryption/decryption
    roundTripTestCases.forEach(testCase => {
        if (encryptExists && decryptExists) {
            // First encrypt, then decrypt the result
            const encryptResult = runFunction('encrypt', [testCase.input])
            
            let roundTripSuccess = false
            if (encryptResult.success && checkReturnValueType(encryptResult.returnValue, 'string')) {
                const decryptResult = runFunction('decrypt', [encryptResult.returnValue])
                roundTripSuccess = decryptResult.success && 
                                   checkReturnValueType(decryptResult.returnValue, 'string') && 
                                   decryptResult.returnValue === testCase.input
            }
            
            checkAndRecord(testCase.description, roundTripSuccess, testCase.points)
        } else {
            // Mark as failed if either function doesn't exist
            checkAndRecord(testCase.description, false, testCase.points)
        }
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 