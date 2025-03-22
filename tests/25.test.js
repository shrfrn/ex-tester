import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that getRandomInt function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('getRandomInt', 2)
    checkAndRecord('Function getRandomInt is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Define test ranges to verify
    const testRanges = [
        { input: [1, 11], min: 1, max: 11, description: 'Function generates numbers in range 1-10', points: 10 },
        { input: [5, 16], min: 5, max: 16, description: 'Function generates numbers in range 5-15', points: 10 },
        { input: [0, 101], min: 0, max: 101, description: 'Function generates numbers in range 0-100', points: 10 }
    ]

    // Run each test range multiple times to verify randomness and range constraints
    if (functionExists) {
        testRanges.forEach(testRange => {
            const results = []
            // Run multiple times to ensure we're getting random results within range
            for (let i = 0; i < 50; i++) {
                const testResult = runFunction('getRandomInt', testRange.input)
                if (testResult.success) {
                    results.push(testResult.returnValue)
                }
            }

            // Check that all results are within expected range
            checkAndRecord(testRange.description, () => {
                return results.length > 0 && 
                       results.every(num => 
                           Number.isInteger(num) && 
                           num >= testRange.min && 
                           num < testRange.max
                       )
            }, testRange.points)

            // Check that we got at least some different values (randomness check)
            checkAndRecord(`Function produces random values in ${testRange.min}-${testRange.max - 1} range`, () => {
                // Set will contain only unique values
                const uniqueValues = new Set(results)
                // We should have at least 2 different values after 50 runs
                // (likely many more, but this is a minimum check)
                return uniqueValues.size > 1
            }, 10)
        })
    } else {
        // If function doesn't exist, mark all range tests as failed
        testRanges.forEach(testRange => {
            checkAndRecord(testRange.description, () => false, testRange.points)
            checkAndRecord(`Function produces random values in ${testRange.min}-${testRange.max - 1} range`, 
                () => false, 10)
        })
    }

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 