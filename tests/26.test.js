import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors (10 times to ensure consistency)
    let successCount = 0
    let results = []
    
    for (let i = 0; i < 10; i++) {
        const result = runScript(studentCode)
        if (result.success) {
            successCount++
            results.push(result)
        }
    }
    
    checkAndRecord('Code executes successfully across multiple runs', successCount === 10, 10)

    // Test that Math.random is used
    checkAndRecord('Uses Math.random', () => {
        return studentCode.includes('Math.random')
    }, 10)
    
    // Check for loops - should be using a loop to generate multiple numbers
    checkAndRecord('Uses a loop to generate numbers', () => {
        const loopPattern = /for\s*\(|while\s*\(/
        return loopPattern.test(studentCode)
    }, 10)
    
    // Check that the code includes variables to track the previous number
    checkAndRecord('Tracks previous number for calculations', () => {
        // Look for variable assignment patterns that might store previous values
        const variablePattern = /(let|var|const)\s+\w+\s*=\s*\w+/
        return variablePattern.test(studentCode)
    }, 10)
    
    // Check for output of at least 10 numbers
    checkAndRecord('Outputs at least 10 numbers', () => {
        // Check all results, succeed if any run has 10 or more numeric outputs
        return results.some(result => {
            // Extract numbers from the output
            const numbers = extractNumbersFromOutput(result.allOutput)
            return numbers.length >= 10
        })
    }, 10)
    
    // Verify that generated numbers are in ascending order
    checkAndRecord('Generates numbers in ascending order', () => {
        // Check if any run produced a valid ascending sequence
        return results.some(result => {
            const numbers = extractNumbersFromOutput(result.allOutput)
            
            // Need at least 2 numbers to check ordering
            if (numbers.length < 2) return false
            
            // Check if each number is greater than the previous one
            for (let i = 1; i < numbers.length; i++) {
                if (numbers[i] <= numbers[i-1]) {
                    return false
                }
            }
            return true
        })
    }, 20)
    
    // Check that first number is between 0-1000
    checkAndRecord('First number is in range 0-1000', () => {
        return results.some(result => {
            const numbers = extractNumbersFromOutput(result.allOutput)
            return numbers.length > 0 && numbers[0] >= 0 && numbers[0] <= 1000
        })
    }, 10)
    
    // Check that each number is properly spaced (within range of previous+1 to previous+1000)
    checkAndRecord('Each number is within the correct range from the previous number', () => {
        return results.some(result => {
            const numbers = extractNumbersFromOutput(result.allOutput)
            
            // Need at least 2 numbers to check ranges
            if (numbers.length < 2) return false
            
            // Check if each number is within range
            for (let i = 1; i < numbers.length; i++) {
                const minAllowed = numbers[i-1] + 1
                const maxAllowed = numbers[i-1] + 1000
                
                if (numbers[i] < minAllowed || numbers[i] > maxAllowed) {
                    return false
                }
            }
            return true
        })
    }, 20)

    return { 
        ...getResults(), 
        success: successCount > 0, 
        error: successCount === 0 ? "Failed to execute successfully" : null, 
        weight: 1, 
        studentCode 
    }
}

// Helper function to extract numbers from output strings
function extractNumbersFromOutput(outputs) {
    const numbers = []
    
    for (const output of outputs) {
        // Extract all numbers from the output
        const matches = output.match(/\b\d+(\.\d+)?\b/g)
        if (matches) {
            // Convert matches to numbers and add to array
            matches.forEach(match => numbers.push(parseFloat(match)))
        }
    }
    
    return numbers
} 