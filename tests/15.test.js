import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 20)

    // Check that calculateSum function exists with 2 parameters
    checkAndRecord('Function calculateSum is defined correctly with 2 parameters', () => {
        return hasFunctionWithSignature('calculateSum', 2)
    }, 10)

    // Check if function returns a value (not just console.log)
    checkAndRecord('Function returns a value', () => {
        return /return\s+[^;]+/.test(studentCode)
    }, 10)

    // Run the function with positive numbers
    const positiveTest = runFunction('calculateSum', [5, 3])
    checkAndRecord('Function correctly adds positive numbers', () => {
        return positiveTest.success && positiveTest.returnValue === 8
    }, 10)

    // Run the function with negative numbers
    const negativeTest = runFunction('calculateSum', [-10, 4])
    checkAndRecord('Function correctly adds a negative and positive number', () => {
        return negativeTest.success && negativeTest.returnValue === -6
    }, 10)

    // Run with two negative numbers
    const twoNegativesTest = runFunction('calculateSum', [-7, -3])
    checkAndRecord('Function correctly adds two negative numbers', () => {
        return twoNegativesTest.success && twoNegativesTest.returnValue === -10
    }, 10)

    // Run with zero
    const zeroTest = runFunction('calculateSum', [0, 5])
    checkAndRecord('Function correctly handles zero', () => {
        return zeroTest.success && zeroTest.returnValue === 5
    }, 10)

    // Test with decimal numbers
    const decimalTest = runFunction('calculateSum', [2.5, 3.5])
    checkAndRecord('Function correctly adds decimal numbers', () => {
        return decimalTest.success && decimalTest.returnValue === 6
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 