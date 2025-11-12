import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    const firstNumber = '10'
    const secondNumber = '3'
    const result = runScript(originalCode, [firstNumber, secondNumber])
    if (!result.success) return executionFailed(result, originalCode)

    checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    
    checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = strippedCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('Modulo operation performed', () => {
        return strippedCode.includes('%') && 
               result.allOutput.some(output => output.includes('1'))
    }, 10)

    checkAndRecord('Division operation performed', () => {
        return strippedCode.includes('/') && 
               result.allOutput.some(output => output.includes('3.333'))
    }, 10)

    checkAndRecord('Multiplication operation performed', () => {
        return strippedCode.includes('*') && 
               result.allOutput.some(output => output.includes('30'))
    }, 10)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = strippedCode.match(conversionPattern) || []
        return matches.length >= 2
    }, 10)

    const testCases = [
        ['12', '4'],
        ['20', '6'],
        ['13', '5']
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [num1, num2] of testCases) {
            const testResult = runScript(originalCode, [num1, num2])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, studentCode: originalCode }
} 