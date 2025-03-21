import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    const celsiusTemp = '25'
    const result = runScript(studentCode, [celsiusTemp])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least once', result.callCounts.prompt >= 1, 10)
    
    checkAndRecord('Prompt result stored in a variable', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('Formula for Fahrenheit conversion used', () => {
        // Look for the formula components: multiplication by 9/5 and addition of 32
        const multiplyPattern = /\*\s*(9\/5|1\.8)/
        const addPattern = /\+\s*32/
        
        return multiplyPattern.test(studentCode) && addPattern.test(studentCode)
    }, 20)

    checkAndRecord('User input converted to a number', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        return conversionPattern.test(studentCode)
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
            const testResult = runScript(studentCode, [celsius])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 