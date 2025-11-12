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
        { 
            input: ['Hello World'], 
            length: 11,
            firstChar: 'H',
            lastChar: 'd',
            upper: 'HELLO WORLD',
            lower: 'hello world',
            description: 'Example from exercise'
        },
        { 
            input: ['JavaScript'], 
            length: 10,
            firstChar: 'J',
            lastChar: 't',
            upper: 'JAVASCRIPT',
            lower: 'javascript',
            description: 'Single word'
        },
        { 
            input: ['123 ABC xyz'], 
            length: 11,
            firstChar: '1',
            lastChar: 'z',
            upper: '123 ABC XYZ',
            lower: '123 abc xyz',
            description: 'Mixed alphanumeric'
        },
        { 
            input: ['   Spaces   '], 
            length: 12,
            firstChar: ' ',
            lastChar: ' ',
            upper: '   SPACES   ',
            lower: '   spaces   ',
            description: 'String with whitespace'
        }
    ]

    // Run the first test case and check basic execution
    const mainTestCase = testCases[0]
    const result = runScript(originalCode, mainTestCase.input)
    if (!result.success) return executionFailed(result, originalCode)

    // Check that prompt is used to get input
    checkAndRecord('Prompts for user input', () => {
        return result.callCounts.prompt >= 1
    }, 10)

    // Check that string length is accessed
    checkAndRecord('Accesses string length property', () => {
        return strippedCode.includes('.length')
    }, 10)

    // Check for appropriate string methods
    checkAndRecord('Uses toUpperCase method', () => {
        const upperPattern = /\.toUpperCase\(\)/
        return upperPattern.test(strippedCode)
    }, 10)
    
    checkAndRecord('Uses toLowerCase method', () => {
        const lowerPattern = /\.toLowerCase\(\)/
        return lowerPattern.test(strippedCode)
    }, 10)
    
    checkAndRecord('Uses charAt method to access characters', () => {
        const charAtPattern = /\.charAt\(\s*\d+\s*\)/
        return charAtPattern.test(strippedCode)
    }, 10)

    // Run all test cases and check for correct outputs
    testCases.forEach(testCase => {
        const testResult = runScript(originalCode, testCase.input)
        const success = testResult.success
        
        // Combine all output for testing (or empty string if execution failed)
        const allOutputText = success ? testResult.allOutput.join(' ') : ''
        
        // Check for length output
        const showsLength = success && allOutputText.includes(testCase.length.toString())
        checkAndRecord(`Shows correct length (${testCase.length}) for "${testCase.description}"`, 
            showsLength, 10)
        
        // Check for first character
        const showsFirstChar = success && allOutputText.includes(testCase.firstChar)
        checkAndRecord(`Shows correct first character for "${testCase.description}"`, 
            showsFirstChar, 10)
        
        // Check for last character
        const showsLastChar = success && allOutputText.includes(testCase.lastChar)
        checkAndRecord(`Shows correct last character for "${testCase.description}"`, 
            showsLastChar, 10)
        
        // Check for uppercase conversion
        const showsUppercase = success && allOutputText.includes(testCase.upper)
        checkAndRecord(`Shows correct uppercase for "${testCase.description}"`, 
            showsUppercase, 10)
        
        // Check for lowercase conversion
        const showsLowercase = success && allOutputText.includes(testCase.lower)
        checkAndRecord(`Shows correct lowercase for "${testCase.description}"`, 
            showsLowercase, 10)
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 