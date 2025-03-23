// Function names are not explicitly defined in the exercise so they are very hard to test for
// Consider using a more explicit instructions 
// Test needs to be examined more closely

import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)

    // Define test cases
    const testCases = [
        { 
            input: ['Igal,Moshe,Haim'], 
            longest: 'Moshe', 
            shortest: 'Haim',
            description: 'Example from exercise'
        },
        { 
            input: ['John,Elizabeth,Bob,Alexander,Jo'], 
            longest: 'Alexander', 
            shortest: 'Jo',
            description: 'Mixed name lengths'
        },
        { 
            input: ['A,BB,CCC,DDDD,EEEEE'], 
            longest: 'EEEEE', 
            shortest: 'A',
            description: 'Simple ascending lengths'
        },
        { 
            input: ['Same,Same,Same'], 
            longest: 'Same', 
            shortest: 'Same',
            description: 'All names same length'
        },
        { 
            input: ['First,Last'], 
            longest: 'First', 
            shortest: 'Last',
            description: 'Only two names'
        },
        {
            input: ['OnlyOne'], 
            longest: 'OnlyOne', 
            shortest: 'OnlyOne',
            description: 'Single name edge case'
        }
    ]

    // Check that indexOf method is used as required
    checkAndRecord('Uses indexOf method', () => {
        return studentCode.includes('.indexOf')
    }, 10)

    // Run all test cases
    testCases.forEach(testCase => {
        const testResult = runScript(studentCode, testCase.input)
        const success = testResult.success
        const allOutputText = success ? testResult.allOutput.join(' ') : ''
        
        // Check that the code executes successfully
        checkAndRecord(`Code executes successfully with "${testCase.description}"`, success, 5)
        
        // Check for correct longest name
        const longestPattern = new RegExp(`longest.*?:.*?\\b${testCase.longest}\\b|longest.*?\\b${testCase.longest}\\b|\\b${testCase.longest}\\b.*?longest`, 'i')
        const hasCorrectLongest = longestPattern.test(allOutputText)
        
        // Check for correct shortest name
        const shortestPattern = new RegExp(`shortest.*?:.*?\\b${testCase.shortest}\\b|shortest.*?\\b${testCase.shortest}\\b|\\b${testCase.shortest}\\b.*?shortest`, 'i')
        const hasCorrectShortest = shortestPattern.test(allOutputText)
        
        // Record individual results
        checkAndRecord(`Identifies longest name correctly (${testCase.longest}) for "${testCase.description}"`,
            success && hasCorrectLongest, 10)
        
        checkAndRecord(`Identifies shortest name correctly (${testCase.shortest}) for "${testCase.description}"`,
            success && hasCorrectShortest, 10)
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 