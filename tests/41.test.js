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

    // Check that sayNum function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('sayNum', 1)
    checkAndRecord('Function sayNum is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases
    const testCases = [
        { 
            input: [123], 
            expected: ['One', 'Two', 'Three'],
            description: 'Example from exercise (123)'
        },
        { 
            input: [7294], 
            expected: ['Seven', 'Two', 'Nine', 'Four'],
            description: 'Example from exercise (7294)'
        },
        { 
            input: [5000], 
            expected: ['Five', 'Zero', 'Zero', 'Zero'],
            description: 'Number with zeros (5000)'
        },
        { 
            input: [9], 
            expected: ['Nine'],
            description: 'Single digit number (9)'
        },
        {
            input: [909090], 
            expected: ['Nine', 'Zero', 'Nine', 'Zero', 'Nine', 'Zero'],
            description: 'Alternating digits (909090)'
        }
    ]
    
    // Check loop usage
    checkAndRecord('Uses a loop to process each digit', () => {
        const loopRegex = /for\s*\(.*\)|while\s*\(.*\)/
        return loopRegex.test(studentCode)
    }, 10)

    // Run all test cases
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('sayNum', testCase.input)
            : { success: false, returnValue: null, allOutput: [] }
        
        if (!functionExists || !testResult.success) {
            return checkAndRecord(`Handles "${testCase.description}" correctly`, false, 10)
        }
        
        // Prepare the expected output patterns
        const allExpectedWords = testCase.expected.join('\\s+')
        const expectedOutputPattern = new RegExp(allExpectedWords, 'i')
        
        // Check individual word patterns in any order if needed
        const individualWordPatterns = testCase.expected.map(word => 
            new RegExp(`\\b${word}\\b`, 'i'))
        
        // Check the output text
        const allOutputText = testResult.allOutput.join(' ')
        const matchesExpectedPattern = expectedOutputPattern.test(allOutputText)
        const allWordsPresent = individualWordPatterns.every(pattern => 
            pattern.test(allOutputText)
        )
        
        checkAndRecord(`Handles "${testCase.description}" correctly`, () => {
            return matchesExpectedPattern || allWordsPresent
        }, 10)
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 