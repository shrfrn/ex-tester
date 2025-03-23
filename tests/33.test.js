// Again Function names are not explicitly defined in the exercise so they are very hard to test for
// Consider using a more explicit instructions 

import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    
    // Define test cases with the same inputs for all three parts
    const testCases = [
        { 
            input: 'Hello JavaScript', 
            vowelCount: { a: 2, e: 1, i: 1, o: 1, u: 0 },
            caseChange: 'HeLLo JaVaSCRiPT',
            doubling: 'Heelloo Jaavaascriiipt',
            description: 'Example from exercise'
        },
        { 
            input: 'aeiouAEIOU', 
            vowelCount: { a: 2, e: 2, i: 2, o: 2, u: 2 },
            caseChange: 'aeiouaeIOU',
            doubling: 'aaeeiioouu', 
            description: 'All vowels'
        },
        { 
            input: 'XYZ123', 
            vowelCount: { a: 0, e: 0, i: 0, o: 0, u: 0 },
            caseChange: 'XYZ123',
            doubling: 'XYZ123',
            description: 'No vowels'
        }
    ]
    
    // Run all tests
    testCases.forEach(testCase => {
        const testResult = runScript(studentCode, [testCase.input])
        const success = testResult.success
        const allOutputText = success ? testResult.allOutput.join(' ') : ''
        const allOutputLower = allOutputText.toLowerCase()
        
        // Check that the code executes successfully
        checkAndRecord('Code executes successfully', success, 10)

        // PART I: Test vowel count
        const vowels = ['a', 'e', 'i', 'o', 'u']
        
        vowels.forEach(vowel => {
            const expectedCount = testCase.vowelCount[vowel]
            
            // Look for patterns where the vowel and its count appear together in the output
            const countPattern = new RegExp(`${vowel}[^a-z0-9]*${expectedCount}|${expectedCount}[^a-z0-9]*${vowel}`, 'i')
            const hasCorrectCount = countPattern.test(allOutputText)
            
            checkAndRecord(`Output shows correct count (${expectedCount}) for vowel '${vowel}' in "${testCase.description}"`,
                success && hasCorrectCount, 10)
        })
        
        // PART II: Test vowel case change
        const hasCorrectCaseChange = allOutputText.includes(testCase.caseChange)
        checkAndRecord(`Correct vowel case change for "${testCase.description}"`,
            success && hasCorrectCaseChange, 10)
            
        // PART III: Test vowel doubling
        const expectedDoubling = testCase.doubling.toLowerCase()
        const hasCorrectDoubling = allOutputLower.includes(expectedDoubling)
        checkAndRecord(`Correct vowel doubling for "${testCase.description}"`,
            success && hasCorrectDoubling, 10)
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
}