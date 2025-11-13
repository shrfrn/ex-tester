import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Define test datasets 
    const testCases = [
        {
            // Example from the exercise
            inputs: ['15', '7', '23', '5', '9', '14', '3', '8', '12', '10'],
            description: 'Example case from the exercise'
        },
        {
            // All positive numbers
            inputs: ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
            description: 'Ascending sequence'
        },
        {
            // Negative numbers included
            inputs: ['-10', '-5', '0', '5', '10', '15', '20', '25', '30', '35'],
            description: 'Negative and positive numbers'
        },
        {
            // All same number
            inputs: ['7', '7', '7', '7', '7', '7', '7', '7', '7', '7'],
            description: 'All numbers the same'
        }
    ]

    // Run first test case and check basic execution
    const mainTestCase = testCases[0]
    const result = runScript(originalCode, mainTestCase.inputs)
    if (!result.success) return executionFailed(result, originalCode)

    // Although the exercise asks for 10 numbers, 
    // the student code might ask for less (for brevity)
    // Check that user input is collected at least 3 times
    const promptCount = result.callCounts.prompt || 0
    checkAndRecord('Prompts for at least 3 numbers', promptCount >= 3, 10)

    // Check that inputs are converted to numbers
    checkAndRecord('User inputs are converted to numbers', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = strippedCode.match(conversionPattern) || []
        return matches.length >= 1
    }, 10)

    // Check for loop usage - only while loops are allowed
    checkAndRecord('Uses while loop to collect numbers', () => {
        const whileLoopPattern = /while\s*\(/
        return whileLoopPattern.test(strippedCode)
    }, 10)

    // Grade each test case separately for max, min, and avg
    testCases.forEach(testCase => {
        const testResult = runScript(originalCode, testCase.inputs)
        const success = testResult.success
        
        // Calculate the expected values based on how many numbers were collected
        const actualPromptCount = testResult.callCounts.prompt || 0
        const numberCount = Math.min(actualPromptCount, testCase.inputs.length)
        
        // Only use the first N numbers based on prompt count
        const actualInputs = testCase.inputs.slice(0, numberCount).map(Number)
        
        // Calculate expected statistics from the actual inputs used
        const expectedMax = Math.max(...actualInputs)
        const expectedMin = Math.min(...actualInputs)
        const expectedAvg = actualInputs.reduce((sum, num) => sum + num, 0) / actualInputs.length
        // Round to 1 decimal place for easier matching
        const expectedAvgRounded = Math.round(expectedAvg * 10) / 10
        
        // Define the checks for each statistic
        const statisticChecks = [
            {
                name: 'Maximum',
                expected: expectedMax,
                check: () => {
                    return success && testResult.allOutput.some(output => 
                        output.includes(expectedMax.toString()))
                }
            },
            {
                name: 'Minimum',
                expected: expectedMin,
                check: () => {
                    return success && testResult.allOutput.some(output => 
                        output.includes(expectedMin.toString()))
                }
            },
            {
                name: 'Average',
                expected: expectedAvgRounded,
                check: () => {
                    // For average, check both the exact value and rounded value
                    const expectedAvgStr = expectedAvgRounded.toString()
                    const exactAvgStr = expectedAvg.toString()
                    
                    return success && testResult.allOutput.some(output => 
                        output.includes(expectedAvgStr) || output.includes(exactAvgStr))
                }
            }
        ]
        
        // Run all checks for this test case
        statisticChecks.forEach(statCheck => {
            checkAndRecord(`${statCheck.name} calculation (${statCheck.expected}) for ${testCase.description}`, 
                statCheck.check, 10)
        })
    })

    return getResults(result.success, originalCode)
} 