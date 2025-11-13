import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()


    // Test valid floor input
    const normalFloor = '3'
    const result = runScript(originalCode, [normalFloor])
    if (!result.success) return executionFailed(result, originalCode)
    
    checkAndRecord('currFloor variable defined and accessed multiple times', () => {
        // Check that currFloor is declared and accessed
        return result.variables.declared.includes('currFloor') && 
               result.variables.accessed.includes('currFloor')
    }, 10)
    
    // Check variable initialization
    checkAndRecord('Initializes currFloor to 0', () => {
        return /currFloor\s*=\s*0/.test(strippedCode)
    }, 10)

    checkAndRecord('Prompt called for floor selection', result.callCounts.prompt >= 1, 10)
    
    checkAndRecord('Stores prompt result in a variable', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = strippedCode.match(promptPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('User input converted to number', () => {
        const conversionPattern = /parseInt|\+[\s]*prompt|Number|parseFloat/g
        const matches = strippedCode.match(conversionPattern) || []
        return matches.length >= 1
    }, 10)

    checkAndRecord('Uses conditional logic', () => {
        const conditionalPattern = /if\s*\(/
        return conditionalPattern.test(strippedCode)
    }, 10)

    checkAndRecord('Updates current floor correctly', () => {
        // Check that currFloor is updated to user's input
        return result.context.currFloor === 3
    }, 10)

    // Test ground floor (exit floor)
    const exitFloor = '0'
    const exitResult = runScript(originalCode, [exitFloor])
    
    checkAndRecord('Shows "Bye bye" message on floor 0', () => {
        return exitResult.context.currFloor === 0 &&
               exitResult.allOutput.some(output => 
                   output.toLowerCase().includes('bye'))
    }, 10)

    // Test negative floor (parking)
    const parkingFloor = '-1'
    const parkingResult = runScript(originalCode, [parkingFloor])
    
    checkAndRecord('Shows "Drive safely" message on negative floors', () => {
        return parkingResult.context.currFloor === -1 &&
               parkingResult.allOutput.some(output => 
                   output.toLowerCase().includes('drive safely'))
    }, 10)

    // Test invalid floor (out of range)
    const invalidFloor = '6'
    const invalidResult = runScript(originalCode, [invalidFloor])
    
    checkAndRecord('Rejects invalid floors outside range', () => {
        // Check that currFloor remains unchanged (still 0) after invalid floor input
        return invalidResult.context.currFloor === 0
    }, 10)
    
    checkAndRecord('Handles invalid floors appropriately', () => {
        // For invalid floor:
        // 1. Check if there's any output message (error notification)
        // 2. Verify currFloor wasn't changed from its initial value
        // 3. Verify special messages for floor 0 or negative floors don't appear
        
        return invalidResult.allOutput.length > 0 && 
               invalidResult.context.currFloor === 0 &&
               !invalidResult.allOutput.some(output => 
                   output.toLowerCase().includes('bye') || 
                   output.toLowerCase().includes('drive safely'))
    }, 10)

    // Test range validation
    checkAndRecord('Checks floor range correctly', () => {
        const rangePattern = /if\s*\([^)]*(-2|<=-2|>=-2)[^)]*(\s*&&\s*|\s*\|\|\s*)[^)]*[<>]=?\s*4/
        return rangePattern.test(strippedCode)
    }, 10)

    // Test different floors
    const testCases = [
        ['3'],   // regular floor
        ['0'],   // exit floor
        ['-1'],  // parking floor
        ['6']    // invalid floor
    ]
    
    checkAndRecord('Output changes appropriately for different floors', () => {
        const outputSet = new Set()
        
        for (const [floor] of testCases) {
            const testResult = runScript(originalCode, [floor])
            
            // Add stringified output to detect uniqueness
            const outputString = JSON.stringify(testResult.allOutput)
            outputSet.add(outputString)
        }
        
        // Check that each test case produced a unique output
        return outputSet.size === testCases.length
    }, 10)

    return getResults(result.success, originalCode)
} 