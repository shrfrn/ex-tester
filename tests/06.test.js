import { runScript, runFunction, hasFunctionWithSignature } from '../src/services/test.service.js'
import { createTestCollector } from '../src/services/test.service.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    // Provide the expected inputs (a=2, b=-5, c=2) for the quadratic equation example
    const result = runScript(studentCode, ['2', '-5', '2'])
    
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check for calculating and displaying -b, 2*a, and discriminant
    const outputContainsValue = (consoleOutput, expectedValue) => {
        const expectedValueString = String(expectedValue)
        return consoleOutput.some(line => line.includes(expectedValueString))
    }

    // Check for variable prompts
    checkAndRecord('Prompts for coefficient values', () => {
        return studentCode.includes('prompt(') && 
               studentCode.match(/prompt\(/g).length >= 3
    }, 10)

    // Check for basic calculations (Part I)
    checkAndRecord('Calculates and displays -b value', () => {
        // Mock the calculation for a=2, b=-5, c=2
        const negB = 5 // -(-5) = 5
        
        // Check if -b appears in console output
        return outputContainsValue(result.consoleOutput, negB)
    }, 10)

    checkAndRecord('Calculates and displays 2*a value', () => {
        // Mock the calculation for a=2, b=-5, c=2
        const twoA = 4 // 2*2 = 4
        
        // Check if 2*a appears in console output
        return outputContainsValue(result.consoleOutput, twoA)
    }, 10)

    checkAndRecord('Calculates and displays discriminant value', () => {
        // Mock the calculation for a=2, b=-5, c=2
        const discriminant = 9 // b^2 - 4ac = (-5)^2 - 4*2*2 = 25 - 16 = 9
        
        // Check if discriminant appears in console output
        return outputContainsValue(result.consoleOutput, discriminant)
    }, 15)

    // Check for Part II (displaying equation)
    checkAndRecord('Displays the quadratic equation (bonus)', () => {
        // Look for patterns that indicate equation formatting
        return result.consoleOutput.some(line => {
            const hasXSquared = line.includes('x²') || line.includes('x^2') || line.includes('x\\u00B2')
            const hasAllTerms = line.includes('x') && line.includes('=')
            return hasXSquared && hasAllTerms
        })
    }, 15)

    // Check for Part III (solving the equation)
    const containsSolution = (consoleOutput, solution) => {
        const solutionString = String(solution)
        return consoleOutput.some(line => line.includes(solutionString))
    }

    checkAndRecord('Calculates and displays solutions (bonus)', () => {
        // For a=2, b=-5, c=2, the solutions are x1=2 and x2=0.5
        const solution1 = 2
        const solution2 = 0.5
        
        // Check if both solutions appear in console output
        return containsSolution(result.consoleOutput, solution1) &&
               containsSolution(result.consoleOutput, solution2)
    }, 15)

    // Also test with another set of inputs for edge cases
    const zeroDiscriminantResult = runScript(studentCode, ['1', '2', '1'])

    checkAndRecord('Handles zero discriminant case properly (bonus)', () => {
        // For a=1, b=2, c=1, discriminant = 0 and solution = -1
        return zeroDiscriminantResult.success && 
               containsSolution(zeroDiscriminantResult.consoleOutput, -1)
    }, 7.5)

    const negativeDiscriminantResult = runScript(studentCode, ['1', '1', '1'])

    checkAndRecord('Handles negative discriminant case properly (bonus)', () => {
        // For a=1, b=1, c=1, discriminant is negative
        // Check if there's a message about no real solutions
        return negativeDiscriminantResult.success && 
               negativeDiscriminantResult.consoleOutput.some(line => 
                  line.match(/no\s+real\s+solutions|imaginary|complex/i))
    }, 7.5)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 