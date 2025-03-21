import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    const firstNumber = '15'
    const secondNumber = '8'
    const thirdNumber = '22'
    const result = runScript(studentCode, [firstNumber, secondNumber, thirdNumber])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least three times', result.callCounts.prompt >= 3, 10)
    
    checkAndRecord('Three variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 3
    }, 10)

    checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    checkAndRecord('Output contains the smallest number', () => {
        // From test values 15, 8, 22 - the smallest is 8
        return result.allOutput.some(output => 
            output.includes('8') && !output.includes('18') && !output.includes('28')
        )
    }, 20)

    checkAndRecord('User input converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt/
        return conversionPattern.test(studentCode)
    }, 10)

    checkAndRecord('Uses comparison operators', () => {
        // Look for less than operator used in comparisons
        const comparisonPattern = /<|<=/
        return comparisonPattern.test(studentCode)
    }, 10)

    // Check for different valid approaches to find minimum
    const checkApproaches = () => {
        // Check for any if statement with comparison
        const ifPattern = /if\s*\(\s*\w+\s*[<>]=?\s*\w+/
        
        // Check for Math.min usage (not allowed)
        const mathMinPattern = /Math\.min/
        
        // Fail if Math.min is used
        if (mathMinPattern.test(studentCode)) return false
        
        // Pass if code uses an if statement with comparison
        return ifPattern.test(studentCode)
    }
    
    checkAndRecord('Uses valid comparison approach without Math.min', checkApproaches, 10)

    const testCases = [
        ['5', '10', '3'],     // Smallest: 3
        ['0', '-5', '2'],     // Smallest: -5
        ['7.5', '7.2', '7.8'] // Smallest: 7.2
    ]
    
    checkAndRecord('Works with different inputs including negatives and decimals', () => {
        // Check if the correct smallest number appears in the output for each test case
        const correctResults = []
        
        // Expected minimum values for each test case
        const expectedMinimums = ['3', '-5', '7.2']
        
        for (let i = 0; i < testCases.length; i++) {
            const testResult = runScript(studentCode, testCases[i])
            
            // Check if any output contains the expected minimum number
            const containsExpectedMinimum = 
                testResult.allOutput.some(output => output.includes(expectedMinimums[i]))
            
            // Pass only if output contains the minimum
            correctResults.push(containsExpectedMinimum)
        }
        
        // All test cases should pass
        return correctResults.every(result => result === true)
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 