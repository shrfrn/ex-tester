// I would consider rephrasing the exercise to require that the algorithm 
// is implemented in a function called getGCD()

import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Define test cases
    const testCases = [
        { inputs: ['6', '15'], expected: 3, description: 'Example from exercise (6 and 15)' },
        { inputs: ['48', '18'], expected: 6, description: 'Common case (48 and 18)' },
        { inputs: ['17', '31'], expected: 1, description: 'Prime numbers (17 and 31)' },
        { inputs: ['0', '5'], expected: 5, description: 'With zero (0 and 5)' },
        { inputs: ['100', '10'], expected: 10, description: 'One is multiple of other (100 and 10)' },
        { inputs: ['7', '7'], expected: 7, description: 'Equal numbers (7 and 7)' },
        { inputs: ['1071', '462'], expected: 21, description: 'Larger numbers (1071 and 462)' }
    ]

    // Run the first test case and check basic execution
    const mainTestCase = testCases[0]
    const result = runScript(originalCode, mainTestCase.inputs)
    if (!result.success) return executionFailed(result, originalCode)

    // Check for loop usage
    checkAndRecord('Uses a loop to find GCD', () => {
        const loopPattern = /for\s*\(|while\s*\(/
        return loopPattern.test(strippedCode)
    }, 10)

    // Check for modulus operator
    checkAndRecord('Uses modulus operator to check divisibility', () => {
        const modulusPattern = /\d+\s*%\s*\d+/  // Match numbers with % between them, allowing whitespace
        return modulusPattern.test(strippedCode)
    }, 10)

    // Run all test cases and check results
    let correctResults = 0
    const totalTestCases = testCases.length
    
    testCases.forEach(testCase => {
        const testResult = runScript(originalCode, testCase.inputs)
        
        if (testResult.success) {
            // Check if any output contains the expected GCD
            const hasCorrectOutput = testResult.allOutput.some(output => 
                output.includes(testCase.expected.toString()))
            
            if (hasCorrectOutput) correctResults++
            
            // Record individual test results
            checkAndRecord(`Correct GCD for ${testCase.description}`, hasCorrectOutput, 10)
        } else {
            checkAndRecord(`Correct GCD for ${testCase.description}`, false, 10)
        }
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 