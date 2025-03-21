import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    const friendCount = '350'
    const result = runScript(studentCode, [friendCount])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least once', result.callCounts.prompt >= 1, 10)
    
    checkAndRecord('Stores prompt result in a variable', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    checkAndRecord('User input converted to a number', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        return conversionPattern.test(studentCode)
    }, 10)

    checkAndRecord('Uses if/else conditional structure', () => {
        // Basic check - must have if and else
        const ifPattern = /if\s*\(/
        const elsePattern = /else/
        
        return ifPattern.test(studentCode) && elsePattern.test(studentCode)
    }, 10)
    
    checkAndRecord('Has proper if-else if structure for all conditions', () => {
        // More specific check - if, 3+ else if's, and else
        // Count the number of else if occurrences
        const elseIfMatches = studentCode.match(/else\s+if\s*\(/g) || []
        const hasEnoughElseIfs = elseIfMatches.length >= 3
        
        // Check for if and else (final case)
        const hasIf = /if\s*\(/.test(studentCode)
        const hasElse = /else\s*{/.test(studentCode)
        
        // Pass if structure is correct and no switch
        return hasIf && hasEnoughElseIfs && hasElse
    }, 20)

    // Test for correct responses to different friend counts
    const testCases = [
        ['0'],           // "Let's be friends!"
        ['50'],          // "Quite picky, aren't you?"
        ['200'],         // "You know some people..."
        ['350'],         // "You are well connected!"
        ['600']          // "OMG, a celebrity!"
    ]

    const expectedResponses = [
        /friends/i,                   // For 0 friends
        /picky/i,                     // For < 100 friends
        /know some people/i,          // For 101-300 friends
        /well connected/i,            // For 301-500 friends
        /celebrity/i                  // For > 500 friends
    ]
    
    checkAndRecord('Shows correct response for different friend counts', () => {
        const responseResults = []
        
        for (let i = 0; i < testCases.length; i++) {
            const testResult = runScript(studentCode, testCases[i])
            // Check if the output matches the expected pattern for this response
            responseResults.push(
                testResult.allOutput.some(output => expectedResponses[i].test(output))
            )
        }
        
        return responseResults.every(result => result === true)
    }, 20)
    
    // Test for handling boundary cases correctly
    const boundaryValues = [
        ['100'],    // Boundary between "picky" and "know some people"
        ['101'],    // Just above boundary
        ['300'],    // Boundary between "know some people" and "well connected"
        ['301'],    // Just above boundary
        ['500'],    // Boundary between "well connected" and "celebrity"
        ['501']     // Just above boundary
    ]
    
    const boundaryResponses = [
        /picky/i,              // 100 friends (should be in < 100 category)
        /know some people/i,   // 101 friends (should be in 101-300 category)
        /know some people/i,   // 300 friends (should be in 101-300 category)
        /well connected/i,     // 301 friends (should be in 301-500 category)
        /well connected/i,     // 500 friends (should be in 301-500 category)
        /celebrity/i           // 501 friends (should be in > 500 category)
    ]
    
    checkAndRecord('Handles boundary cases correctly', () => {
        const boundaryResults = []
        
        for (let i = 0; i < boundaryValues.length; i++) {
            const testResult = runScript(studentCode, boundaryValues[i])
            // Check if the output matches the expected pattern for this boundary case
            boundaryResults.push(
                testResult.allOutput.some(output => boundaryResponses[i].test(output))
            )
        }
        
        return boundaryResults.every(result => result === true)
    }, 10)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 