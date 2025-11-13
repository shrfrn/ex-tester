import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    const distance = '100'
    const speed = '50'
    const result = runScript(originalCode, [distance, speed])
    if (!result.success) return executionFailed(result, originalCode)

    checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    
    checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = strippedCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('Division operation performed', () => {
        return strippedCode.includes('/') && 
               result.allOutput.some(output => output.includes('2'))
    }, 10)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = strippedCode.match(conversionPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('Time calculation formula used correctly', () => {
        // Look for distance / speed pattern in code
        const formulaPattern = /(\w+)\s*\/\s*(\w+)/g
        const matches = [...strippedCode.matchAll(formulaPattern)]
        
        // Check if the calculated time is correct
        return matches.length > 0 && 
               result.allOutput.some(output => output.includes('2'))
    }, 10)

    checkAndRecord('Output contains calculated time value', () => {
        return result.allOutput.some(output => output.includes('2'))
    }, 10)

    const testCases = [
        ['200', '50'], // should be 4 hours
        ['150', '30'], // should be 5 hours
        ['60', '20']   // should be 3 hours
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [dist, spd] of testCases) {
            const testResult = runScript(originalCode, [dist, spd])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return getResults(result.success, originalCode)
} 