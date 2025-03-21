import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // First test case - relatively close numbers
    const num1 = '5'
    const num2 = '9'
    const result = runScript(studentCode, [num1, num2])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    
    checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = studentCode.match(conversionPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('Calculates absolute difference', () => {
        // Check for either Math.abs or if statement with comparison operator
        const absPattern = /Math\.abs|if\s*\(\s*\w+\s*[<>]=?\s*\w+/i
        return absPattern.test(studentCode) && 
               result.allOutput.some(output => output.includes('4')) &&
               !result.allOutput.some(output => output.includes('-4'))
    }, 20)

    checkAndRecord('Displays both input numbers', () => {
        return result.allOutput.some(output => 
            output.includes('5') && output.includes('9'))
    }, 10)

    checkAndRecord('Displays "relatively close" message for close numbers', () => {
        return result.allOutput.some(output => 
            output.toLowerCase().includes('relatively close'))
    }, 10)

    // Test case for numbers that are not relatively close
    const notCloseResult = runScript(studentCode, ['3', '15'])
    
    checkAndRecord('Does not display "relatively close" message for distant numbers', () => {
        return !notCloseResult.allOutput.some(output => 
            output.toLowerCase().includes('relatively close'))
    }, 10)

    checkAndRecord('Correctly compares difference with both input values', () => {
        // Look for comparison of difference with both inputs
        const comparisonPattern = /\w+\s*<\s*\w+\s*&&\s*\w+\s*<\s*\w+|\w+\s*<\s*Math\.min/
        return comparisonPattern.test(studentCode)
    }, 10)

    const testCases = [
        ['5', '9'],   // difference (4) is smaller than both inputs
        ['3', '15'],  // difference (12) is not smaller than both inputs
        ['10', '2']   // difference (8) is not smaller than both inputs
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [a, b] of testCases) {
            const testResult = runScript(studentCode, [a, b])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 