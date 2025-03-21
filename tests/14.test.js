import { runScript, runFunction } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Run the script to define the function
    const result = runScript(studentCode)

    checkAndRecord('Code executes successfully', result.success, 20)
    
    checkAndRecord('Function defined correctly', () => {
        return typeof result.context.greetUser === 'function'
    }, 10)
    
    checkAndRecord('Function has correct name', () => {
        return /function\s+greetUser\s*\(/.test(studentCode)
    }, 10)
    
    checkAndRecord('Function accepts parameter', () => {
        const paramPattern = /function\s+greetUser\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/
        const matches = studentCode.match(paramPattern)
        return matches && matches.length > 1
    }, 10)
    
    // Get the parameter name to check it's used
    const paramPattern = /function\s+greetUser\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/
    const matches = studentCode.match(paramPattern)
    const paramName = matches && matches.length > 1 ? matches[1] : null
    
    if (paramName) {
        checkAndRecord('Parameter name is used in function body', () => {
            const functionBody = studentCode.match(/function\s+greetUser\s*\([^)]*\)\s*{([^}]*)}/s)
            return functionBody && functionBody[1].includes(paramName)
        }, 10)
    }
    
    // Test function with different names
    const testCases = ['John', 'Sarah', 'Alex']
    
    for (const name of testCases) {
        // Run the function directly
        const functionResult = runFunction('greetUser', [name])
        
        if (functionResult.success) {
            // If it runs, check that output contains the name
            checkAndRecord(`Output contains name "${name}"`, () => {
                return functionResult.allOutput.some(output => 
                    output.toLowerCase().includes(name.toLowerCase()))
            }, 5)
        }
    }
    
    // Check for console.log or alert usage
    checkAndRecord('Uses console.log or alert for output', () => {
        return result.callCounts.console?.log > 0 || result.callCounts.alert > 0
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 