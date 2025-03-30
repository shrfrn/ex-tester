import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode, {
        mockPrompt: ['5', '12', '7', '8', '9', '10', '3', '4', '6', '1']
    })
    checkAndRecord('Code executes successfully', result.success, 20)

    // Define the expected output messages - now using a single array for both paths
    const expectedMessages = [
        { text: '5 is an odd number', description: 'Correctly identifies 5 as odd', points: 8 },
        { text: '12 is an even number', description: 'Correctly identifies 12 as even', points: 8 },
        { text: '7 is an odd number', description: 'Correctly identifies 7 as odd', points: 8 },
        { text: '8 is an even number', description: 'Correctly identifies 8 as even', points: 8 },
        { text: '9 is an odd number', description: 'Correctly identifies 9 as odd', points: 8 },
        { text: '10 is an even number', description: 'Correctly identifies 10 as even', points: 8 },
        { text: '3 is an odd number', description: 'Correctly identifies 3 as odd', points: 8 },
        { text: '4 is an even number', description: 'Correctly identifies 4 as even', points: 8 },
        { text: '6 is an even number', description: 'Correctly identifies 6 as even', points: 8 },
        { text: '1 is an odd number', description: 'Correctly identifies 1 as odd', points: 8 }
    ]

    const allOutput = result.allOutput || []
    const consoleOutput = result.consoleOutput || []
    
    // Check for each expected message in the output
    expectedMessages.forEach(message => {
        checkAndRecord(message.description, () => {
            // Only check output if script ran successfully
            return result.success &&
                    consoleOutput.some(output => output.includes(message.text))
        }, message.points)
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 