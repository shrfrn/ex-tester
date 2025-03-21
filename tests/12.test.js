import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test first with all confirming answers (man + blonde = Philip Seymour)
    const result = runScript(studentCode, [true, true])

    checkAndRecord('Code executes successfully', result.success, 20)

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
        
        return ifPattern.test(studentCode) && elsePattern.test(studentCode)
    }, 10)

    checkAndRecord('Has nested if/else structure', () => {
        // Check for nested if/else structure
        const nestedIfPattern = /if\s*\([^{]*\)\s*{[^}]*if\s*\(/
        return nestedIfPattern.test(studentCode)
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
            const testResult = runScript(studentCode, testCase)
            
            // Check if the output contains the correct actor
            responseResults.push(
                testResult.allOutput.some(output => expectedActors[i].test(output))
            )
        })
        
        return responseResults.every(result => result === true)
    }, 20)

    return { ...getResults(), success: result.success, error: result.error, weight: 1, studentCode }
} 