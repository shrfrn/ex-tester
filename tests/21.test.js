import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test inputs based on example
    const testCases = [
        {
            inputs: ['9', '25', '14', '30', '999'],
            expectedOutputs: [
                { pattern: /9.*divisible by 3/i, description: 'Correctly identifies 9 as divisible by 3', points: 10 },
                { pattern: /25.*not divisible by 3/i, description: 'Correctly identifies 25 as not divisible by 3', points: 10 },
                { pattern: /25.*larger by more than 10.*9/i, description: 'Correctly identifies 25 as larger by more than 10 from 9', points: 10 },
                { pattern: /14.*not divisible by 3/i, description: 'Correctly identifies 14 as not divisible by 3', points: 10 },
                { pattern: /30.*divisible by 3/i, description: 'Correctly identifies 30 as divisible by 3', points: 10 },
                { pattern: /30.*larger by more than 10.*14/i, description: 'Correctly identifies 30 as larger by more than 10 from 14', points: 10 }
            ]
        },
        {
            inputs: ['3', '7', '12', '15', '999'],
            expectedOutputs: [
                { pattern: /3.*divisible by 3/i, description: 'Correctly identifies 3 as divisible by 3', points: 5 },
                { pattern: /7.*not divisible by 3/i, description: 'Correctly identifies 7 as not divisible by 3', points: 5 },
                { pattern: /12.*divisible by 3/i, description: 'Correctly identifies 12 as divisible by 3', points: 5 },
                { pattern: /15.*divisible by 3/i, description: 'Correctly identifies 15 as divisible by 3', points: 5 }
            ]
        }
    ]

    // Run each test case
    testCases.forEach((testCase, index) => {
        // Test that the script runs without errors
        const result = runScript(studentCode, testCase.inputs)
        
        const testPrefix = `Test case ${index + 1}`
        checkAndRecord(`${testPrefix} executes successfully`, result.success, 10)

        if (result.success) {
            const consoleOutput = result.consoleOutput || []
            const allOutput = result.allOutput || []
            
            // Check each expected output
            testCase.expectedOutputs.forEach(expected => 
                checkAndRecord(expected.description, () => consoleOutput.some(output => 
                    expected.pattern.test(output)), expected.points))
        } else {
            // If execution failed, mark all output checks as failed
            testCase.expectedOutputs.forEach(expected => {
                checkAndRecord(expected.description, () => false, expected.points)
            })
        }
    })

    return { 
        ...getResults(), 
        success: true, 
        error: null, 
        weight: 1, 
        studentCode 
    }
} 