import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let collector = createTestCollector()

    const firstNumber = '10'
    const secondNumber = '3'
    const result = runScript(studentCode, [firstNumber, secondNumber])

    collector.checkAndRecord('Code executes successfully', result.success, 20)

    collector.checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    
    collector.checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    collector.checkAndRecord('Modulo operation performed', () => {
        return studentCode.includes('%') && 
               result.allOutput.some(output => output.includes('1'))
    }, 10)

    collector.checkAndRecord('Division operation performed', () => {
        return studentCode.includes('/') && 
               result.allOutput.some(output => output.includes('3.333'))
    }, 10)

    collector.checkAndRecord('Multiplication operation performed', () => {
        return studentCode.includes('*') && 
               result.allOutput.some(output => output.includes('30'))
    }, 10)

    collector.checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt/g
        return conversionPattern.test(studentCode)
    }, 10)

    const testCases = [
        ['12', '4'],
        ['20', '6'],
        ['13', '5']
    ]
    
    collector.checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const [num1, num2] of testCases) {
            const testResult = runScript(studentCode, [num1, num2])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...collector.getResults(), success: result.success, error: result.error, weight: 1 }
} 