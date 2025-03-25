import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check for matrix definition
    checkAndRecord('Creates a matrix with numbers', () => {
        // Access the context object containing all global variables and functions
        const context = result.context || {}
        
        // Check each property in the context to find a matrix
        return Object.values(context).some(variable => {
            // Check if it's an array
            if (!Array.isArray(variable)) return false
            
            // Check if it has at least one element 
            if (variable.length === 0) return false
            
            // Check if all elements are arrays (making it a 2D array)
            return variable.every(row => Array.isArray(row) && row.length > 0)
        })
    }, 10)

    // Check that required functions exist with correct parameters
    const findModeExists = hasFunctionWithSignature('findMode', 1)
    
    // Check function definition
    checkAndRecord('Function findMode is defined correctly', findModeExists, 20)
    
    // Create test matrices
    const testMatrix1 = [
        [1, 2, 3],
        [2, 4, 2],
        [3, 2, 5]
    ] // Mode is 2 (appears 4 times)
    
    const testMatrix2 = [
        [1, 2, 3],
        [2, 4, 3],
        [3, 2, 5]
    ] // Multiple modes: 2 and 3 (both appear 3 times)
    
    const testMatrix3 = [
        [7, 7, 7],
        [7, 7, 7],
        [7, 7, 7]
    ] // All values are the same (7)
    
    const testMatrix4 = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12]
    ] // No repeated values
    
    const testMatrix5 = [
        [-1, -1, 2],
        [2, 3, -1],
        [4, -1, 5]
    ] // Mode includes negative numbers (-1 appears 4 times)

    // Function to check if any console output line contains the expected mode(s)
    const outputContainsMode = (consoleOutput, expectedModes) => {
        // Convert expected modes to array if it's not already
        const expectedModesArray = Array.isArray(expectedModes) ? expectedModes : [expectedModes]
        
        // Check each line of console output separately
        return consoleOutput.some(line => {
            // Extract numbers from this single line
            const numbers = (line.match(/[-+]?\d+(\.\d+)?/g) || []).map(Number)
            
            // Check if this line has exactly the expected modes and nothing else
            // OR if it contains all the expected modes (could have more numbers)
            
            const exactMatch = 
                numbers.length === expectedModesArray.length && 
                expectedModesArray.every(mode => numbers.includes(mode))
                
            const containsMatch = 
                expectedModesArray.every(mode => numbers.includes(mode)) && 
                numbers.length <= expectedModesArray.length + 3

            return exactMatch || containsMatch
        })
    }
    
    // Test findMode function with a single mode
    checkAndRecord('findMode correctly identifies single mode', () => {
        if (!findModeExists) return false
        
        // Run findMode
        const findModeResult = runFunction('findMode', [testMatrix1])
        if (!findModeResult.success) return false
        
        // Check if any line of output contains the expected mode
        return outputContainsMode(findModeResult.consoleOutput, 2)
    }, 10)
    
    // Test findMode function with multiple modes (bonus)
    checkAndRecord('findMode correctly identifies multiple modes (bonus)', () => {
        if (!findModeExists) return false
        
        // Run findMode
        const findModeResult = runFunction('findMode', [testMatrix2])
        if (!findModeResult.success) return false
        
        // Check if any line of output contains both expected modes
        return outputContainsMode(findModeResult.consoleOutput, [2, 3])
    }, 10)
    
    // Test findMode with all identical values
    checkAndRecord('findMode correctly handles matrix with all identical values', () => {
        if (!findModeExists) return false
        
        // Run findMode
        const findModeResult = runFunction('findMode', [testMatrix3])
        if (!findModeResult.success) return false
        
        // Check if any line of output contains the expected mode
        return outputContainsMode(findModeResult.consoleOutput, 7)
    }, 10)
    
    // Test findMode with no repeated values
    checkAndRecord('findMode correctly handles matrix with no repeated values', () => {
        if (!findModeExists) return false
        
        // Run findMode
        const findModeResult = runFunction('findMode', [testMatrix4])
        if (!findModeResult.success) return false
        
        // In this case, all values appear exactly once, so all are modes
        // At minimum, the function should print at least one value
        return findModeResult.consoleOutput.length > 0
    }, 10)
    
    // Test findMode with negative numbers
    checkAndRecord('findMode correctly handles matrix with negative numbers', () => {
        if (!findModeExists) return false
        
        // Run findMode
        const findModeResult = runFunction('findMode', [testMatrix5])
        if (!findModeResult.success) return false
        
        // Check if any line of output contains the expected mode
        return outputContainsMode(findModeResult.consoleOutput, -1)
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 