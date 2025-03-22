import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Run the script to define the function
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 20)
    
    // Check that greetUser function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('greetUser', 1)
    checkAndRecord('Function greetUser is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)
    
    // Check parameter name usage if function exists
    if (functionExists) {
        const paramPattern = /function\s+greetUser\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/
        const matches = studentCode.match(paramPattern)
        const paramName = matches && matches.length > 1 ? matches[1] : null
        
        if (paramName) {
            checkAndRecord('Parameter name is used in function body', () => {
                const functionBody = studentCode.match(/function\s+greetUser\s*\([^)]*\)\s*{([^}]*)}/s)
                return functionBody && functionBody[1].includes(paramName)
            }, 10)
        } else {
            checkAndRecord('Parameter name is used in function body', false, 10)
        }
    } else {
        checkAndRecord('Parameter name is used in function body', false, 10)
    }
    
    // Define test cases for names
    const nameTestCases = [
        { input: ['John'], description: 'Function runs successfully with name "John"', outputCheck: 'john', points: 5 },
        { input: ['Sarah'], description: 'Function runs successfully with name "Sarah"', outputCheck: 'sarah', points: 5 },
        { input: ['Alex'], description: 'Function runs successfully with name "Alex"', outputCheck: 'alex', points: 5 }
    ]
    
    // Run all name test cases
    nameTestCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise fail
        const functionResult = functionExists 
            ? runFunction('greetUser', testCase.input)
            : { success: false, allOutput: [] }
        
        // Check if function runs successfully
        checkAndRecord(testCase.description, () => {
            return functionExists && functionResult.success
        }, testCase.points)
        
        // Check if output contains the name
        checkAndRecord(`Output contains name "${testCase.input[0]}"`, () => {
            return functionExists && 
                   functionResult.success && 
                   functionResult.allOutput.some(output => 
                        output.toLowerCase().includes(testCase.outputCheck))
        }, testCase.points)
    })
    
    // Check for console.log or alert usage
    checkAndRecord('Uses console.log or alert for output', () => {
        return functionExists && (result.callCounts.console?.log > 0 || result.callCounts.alert > 0)
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 