import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

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
    const result = runScript(studentCode, mainTestCase.input)
    checkAndRecord('Code executes successfully', result.success, 20)

    // Check that prompt is used to get input
    checkAndRecord('Prompts for user input', () => {
        return result.callCounts.prompt >= 1
    }, 10)

    // Check that string length is accessed
    checkAndRecord('Accesses string length property', () => {
        return studentCode.includes('.length')
    }, 10)

    // Check for appropriate string methods
    checkAndRecord('Uses toUpperCase method', () => {
        const upperPattern = /\.toUpperCase\(\)/
        return upperPattern.test(studentCode)
    }, 10)
    
    checkAndRecord('Uses toLowerCase method', () => {
        const lowerPattern = /\.toLowerCase\(\)/
        return lowerPattern.test(studentCode)
    }, 10)
    
    checkAndRecord('Uses charAt method to access characters', () => {
        const charAtPattern = /\.charAt\(\s*\d+\s*\)/
        return charAtPattern.test(studentCode)
    }, 10)

    // Run all test cases and check for correct outputs
    testCases.forEach(testCase => {
        const testResult = runScript(studentCode, testCase.input)
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
        weight: 1, 
        studentCode 
    }
} 