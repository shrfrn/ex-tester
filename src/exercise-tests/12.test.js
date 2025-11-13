import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Test first with all confirming answers (man + blonde = Philip Seymour)
    const result = runScript(originalCode, [true, true])
    if (!result.success) return executionFailed(result, originalCode)

    checkAndRecord('Uses alert to start the game', () => {
        return result.callCounts.alert > 0
    }, 10)

    checkAndRecord('Uses confirm for yes/no questions', () => {
        // Check confirm is called at least twice
        return result.callCounts.confirm >= 2
    }, 10)

    checkAndRecord('Output uses console.log', () => {
        // Check if console.log is called at least once
        return result.callCounts.consoleLog > 0
    }, 10)

    checkAndRecord('Uses if/else conditional structure', () => {
        // Must have if and else
        const ifPattern = /if\s*\(/
        const elsePattern = /else/
        
        return ifPattern.test(strippedCode) && elsePattern.test(strippedCode)
    }, 10)

    checkAndRecord('Has nested if/else structure', () => {
        // Check for nested if/else structure
        const nestedIfPattern = /if\s*\([^{]*\)\s*{[^}]*if\s*\(/
        return nestedIfPattern.test(strippedCode)
    }, 10)

    // Test all four possible answer combinations
    const testCases = [
        [true, true],    // Man + Blonde = Philip Seymour
        [true, false],   // Man + Not Blonde = Tom Cruise
        [false, true],   // Woman + English = Keira Knightley
        [false, false]   // Woman + Not English = Natalie Portman
    ]

    const expectedActors = [
        /philip\s*seymour/i,
        /tom\s*cruise/i,
        /keira\s*knightley/i,
        /natalie\s*portman/i
    ]
    
    checkAndRecord('Outputs correct actor for each path', () => {
        const responseResults = []
        
        testCases.forEach((testCase, i) => {
            const testResult = runScript(originalCode, testCase)
            
            // Check if the output contains the correct actor
            responseResults.push(
                testResult.allOutput.some(output => expectedActors[i].test(output))
            )
        })
        
        return responseResults.every(result => result === true)
    }, 20)

    return getResults(result.success, originalCode)
} 