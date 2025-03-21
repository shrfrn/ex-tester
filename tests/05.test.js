import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    const firstDigit = '3'
    const secondDigit = '2'
    const thirdDigit = '6'
    const result = runScript(studentCode, [firstDigit, secondDigit, thirdDigit])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least three times', result.callCounts.prompt >= 3, 10)
    
    checkAndRecord('Three variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 3
    }, 10)

    checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    checkAndRecord('Output contains the joined number', () => {
        const expectedNumber = firstDigit + secondDigit + thirdDigit // '326'
        return result.allOutput.some(output => output.includes(expectedNumber))}, 20)

    // Check if code uses string concatenation or numeric operations
    const stringJoinCheck = () => {
        // Look for string concatenation patterns - direct concatenation of variables
        const concatPattern = /\w+\s*\+\s*\w+\s*\+\s*\w+/
        return concatPattern.test(studentCode)
    }

    const numericJoinCheck = () => {
        // For numeric operations, both multiplications by 10 and 100 should be present
        const mult10Pattern = /\*\s*10/
        const mult100Pattern = /\*\s*100/
        
        return mult10Pattern.test(studentCode) && mult100Pattern.test(studentCode)
    }

    checkAndRecord('Uses string concatenation or numeric operations', 
        () => stringJoinCheck() || numericJoinCheck(), 10)

    // Bonus check - uses numeric operations (not string concatenation)
    checkAndRecord('Uses numeric operations', () => numericJoinCheck(), 10)
    
    // Bonus check - converting inputs to numbers
    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = studentCode.match(conversionPattern) || []
        return matches.length >= 3
    }, 10)

    const testCases = [
        ['1', '2', '3'],  // 123
        ['9', '8', '7'],  // 987
        ['5', '0', '5']   // 505
    ]
    
    checkAndRecord('Output changes based on different inputs', () => {
        const outputSet = new Set()
        
        for (const inputs of testCases) {
            const testResult = runScript(studentCode, inputs)
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 