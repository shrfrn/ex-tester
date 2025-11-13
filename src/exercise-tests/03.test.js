import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    const celsiusTemp = '25'
    const result = runScript(originalCode, [celsiusTemp])
    if (!result.success) return executionFailed(result, originalCode)

    checkAndRecord('Prompt called at least once', result.callCounts.prompt >= 1, 10)
    
    checkAndRecord('Prompt result stored in a variable', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = strippedCode.match(promptPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('Formula for Fahrenheit conversion used', () => {
        // Look for the formula components: multiplication by 9/5 and addition of 32
        const multiplyPattern = /\*\s*(9\/5|1\.8)/
        const addPattern = /\+\s*32/
        
        return multiplyPattern.test(strippedCode) && addPattern.test(strippedCode)
    }, 20)

    checkAndRecord('User input converted to a number', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        return conversionPattern.test(strippedCode)
    }, 10)

    checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    checkAndRecord('Output includes Fahrenheit value', () => {
        return result.allOutput.some(output => 
            output.includes('77') || output.includes('77.0')
        )
    }, 10)

    const testCases = [
        ['0'],    // 0°C = 32°F
        ['100'],  // 100°C = 212°F
        ['-40']   // -40°C = -40°F
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [celsius] of testCases) {
            const testResult = runScript(originalCode, [celsius])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return getResults(result.success, originalCode)
} 