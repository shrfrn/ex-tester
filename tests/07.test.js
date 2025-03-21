import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // First test case - when sum is equal
    const num1 = '6'
    const num2 = '4'
    const num3 = '10'
    const result = runScript(studentCode, [num1, num2, num3])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least three times', result.callCounts.prompt >= 3, 10)
    
    checkAndRecord('At least three variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 3
    }, 10)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = studentCode.match(conversionPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('Addition operation performed', () => {
        const additionPattern = /[\w\s]+\+[\w\s]+/
        return additionPattern.test(studentCode) && 
               result.allOutput.some(output => output.includes('+'))
    }, 10)

    checkAndRecord('Comparison operation performed', () => {
        // Look for comparison operators
        const comparisonPattern = /===|!==/
        return comparisonPattern.test(studentCode)
    }, 10)

    checkAndRecord('Equal case output format correct', () => {
        // Check for format like "6 + 4 = 10"
        return result.allOutput.some(output => {
            const formatPattern = /6\s*\+\s*4\s*=\s*10/
            return formatPattern.test(output)
        })
    }, 10)

    // Test case for when sum is not equal
    const notEqualResult = runScript(studentCode, ['3', '5', '10'])
    
    checkAndRecord('Not equal case output format correct', () => {
        // Check for format like "3 + 5 != 10"
        return notEqualResult.allOutput.some(output => {
            const formatPattern = /3\s*\+\s*5\s*!=\s*10/
            return formatPattern.test(output)
        })
    }, 10)

    const testCases = [
        ['2', '3', '5'],   // equal case
        ['10', '5', '15'],  // equal case
        ['7', '8', '10']    // not equal case
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [a, b, c] of testCases) {
            const testResult = runScript(studentCode, [a, b, c])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    // Check for conditional logic in the code
    checkAndRecord('Uses conditional logic', () => {
        const conditionalPattern = /if\s*\(.*\)|.*\?\s*.*\s*:\s*.*/
        return conditionalPattern.test(studentCode)
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
}