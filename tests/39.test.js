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

    // Check that countVotes function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('countVotes', 2)
    checkAndRecord('Function countVotes is defined correctly with 2 parameters', functionExists, 20)

    // Define test cases for different vote counting scenarios
    const testCases = [
        { 
            input: [['Nuli', 'Pingi', 'Uza', 'Shabi', 'Uza'], 'Uza'], 
            expected: 2,
            description: 'Correctly counts 2 votes for Uza', 
            points: 10 
        },
        { 
            input: [['John', 'Jane', 'John', 'John'], 'John'], 
            expected: 3,
            description: 'Correctly counts 3 votes for John', 
            points: 10 
        },
        { 
            input: [['Alex', 'Bella', 'Charlie', 'David'], 'Zoe'], 
            expected: 0,
            description: 'Correctly returns 0 when candidate not found', 
            points: 10 
        },
        { 
            input: [[], 'Any'], 
            expected: 0,
            description: 'Correctly handles empty vote array', 
            points: 10 
        },
        { 
            input: [['jane', 'John', 'JANE', 'Jane'], 'Jane'], 
            expected: 1,
            description: 'Handles case sensitivity (only counting exact matches)', 
            points: 10 
        },
        { 
            input: [['Tom', 'Jerry', 'Tom', 'Tom', 'Jerry', 'Tom'], 'Tom'], 
            expected: 4,
            description: 'Correctly counts multiple occurrences in larger arrays', 
            points: 10 
        },
        { 
            input: [[null, undefined, '', 'valid'], 'valid'], 
            expected: 1,
            description: 'Handles arrays with null/undefined/empty values', 
            points: 10 
        },
        { 
            input: [['name with spaces', 'simple'], 'name with spaces'], 
            expected: 1,
            description: 'Handles candidate names with spaces', 
            points: 10 
        }
    ]

    // Test all cases using the same pattern
    testCases.forEach(testCase => {
        // Only run the function if it exists, otherwise return a default result
        const testResult = functionExists 
            ? runFunction('countVotes', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'number')) return false
            
            return testResult.returnValue === testCase.expected
        }, testCase.points)
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 