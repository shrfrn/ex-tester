// The exercise does not specify how to handle names of equal length
// Here too, I wouldn't consider changing the instructions to require 
// that the algorithm is encapsulated within a function

import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Define test cases with inputs and expected outputs
    const testCases = [
        {
            inputs: ['John', 'Michael'],
            expected: 'Michael',
            description: 'Correctly identifies "Michael" as longer than "John"',
            points: 10,
        },
        {
            inputs: ['Sarah', 'Tom'],
            expected: 'Sarah',
            description: 'Correctly identifies "Sarah" as longer than "Tom"',
            points: 10,
        },
        {
            inputs: ['Alex', 'Mary'],
            expected: 'Mary',
            description: 'Correctly identifies "Mary" as longer than "Alex"',
            points: 10,
        },
        {
            inputs: ['Emma', 'Lisa'],
            expected: 'Emma',
            description: 'Correctly identifies "Emma" as longer than "Lisa"',
            points: 10,
        },
        {
            inputs: ['Kim', 'Bob'],
            expected: /(Kim|Bob)/,
            description: 'Handles equal length names appropriately',
            points: 10,
        },
        {
            inputs: ['', 'Test'],
            expected: 'Test',
            description: 'Handles empty string input appropriately',
            points: 10,
        }
    ]

    // Run through each test case
    testCases.forEach(testCase => {
        const result = runScript(studentCode, testCase.inputs)
        
        checkAndRecord(`Execution for "${testCase.inputs[0]}" and "${testCase.inputs[1]}" succeeds`, 
            result.success, 10)
        
        // Check for execution failure first and mark test as failed
        if (!result.success) {
            checkAndRecord(testCase.description, () => false, testCase.points)
            return
        }
        
        // Now we know execution succeeded, check the output
        const consoleOutput = result.consoleOutput || []
        
        checkAndRecord(testCase.description, () => 
            consoleOutput.some(output => 
                output.trim() === testCase.expected), testCase.points)
    })

    return { 
        ...getResults(), 
        success: true, 
        error: null, 
        weight: 1, 
        studentCode 
    }
} 