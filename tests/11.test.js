import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Check variable initialization
    checkAndRecord('Initializes currBalance with 1000', () => {
        return /currBalance\s*=\s*1000/.test(studentCode)
    }, 10)

    checkAndRecord('Initializes PIN as a constant with value 0796', () => {
        return /(let|const|var)\s+PIN\s*=\s*['"]0796['"]/i.test(studentCode)
    }, 10)

    // Correct PIN test case
    const correctPIN = '0796'
    const withdrawAmount = '300'
    const result = runScript(studentCode, [correctPIN, withdrawAmount])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    
    checkAndRecord('Uses prompt for PIN and withdrawal amount', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = studentCode.match(conversionPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('Uses conditional logic', () => {
        const conditionalPattern = /if\s*\(/
        return conditionalPattern.test(studentCode)
    }, 10)

    checkAndRecord('Compares entered PIN with stored PIN', () => {
        const pinComparisonPattern = /if\s*\(\s*\w+\s*===?\s*PIN|if\s*\(\s*PIN\s*===?\s*\w+/
        return pinComparisonPattern.test(studentCode)
    }, 10)

    checkAndRecord('Updates balance after withdrawal', () => {
        // Check that balance updated correctly & both prompts are called
        return result.context.currBalance === 700 && result.callCounts.prompt === 2 
    }, 10)
    
    checkAndRecord('Successful withdrawal with correct PIN shows new balance', () => {
        // Check output contains successful withdrawal message with balance of 700
        return result.allOutput.some(output => output.includes('700'))
    }, 10)

    // Incorrect PIN test case
    const incorrectPIN = '1234'
    const incorrectPINResult = runScript(studentCode, [incorrectPIN, withdrawAmount])
    
    checkAndRecord('Access denied with incorrect PIN', () => {
        // Check that only one prompt is called with incorrect PIN
        // (second prompt for withdrawal amount should be skipped)
        return incorrectPINResult.callCounts.prompt === 1
    }, 10)

    // Excessive withdrawal test case
    const excessiveAmount = '1500'
    const excessiveResult = runScript(studentCode, [correctPIN, excessiveAmount])
    
    checkAndRecord('Prevents excessive withdrawals', () => {
        // Check that balance remains unchanged (still 1000) after excessive withdrawal attempt
        return excessiveResult.context.currBalance === 1000 &&
               excessiveResult.callCounts.prompt === 2 // Both prompts are called
    }, 10)

    // Test all scenarios 
    const testCases = [
        [correctPIN, withdrawAmount],  // correct PIN, valid withdrawal
        [incorrectPIN, withdrawAmount], // incorrect PIN
        [correctPIN, excessiveAmount]   // correct PIN, excessive withdrawal
    ]
    
    checkAndRecord('Output changes appropriately for different cases', () => {
        const outputSet = new Set()
        
        for (const [pin, amount] of testCases) {
            const testResult = runScript(studentCode, [pin, amount])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 