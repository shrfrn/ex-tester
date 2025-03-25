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

    // Check that required function exists with correct parameters
    const isMagicSquareExists = hasFunctionWithSignature('isMagicSquare', 1)
    
    // Check function definition
    checkAndRecord('Function isMagicSquare is defined correctly', isMagicSquareExists, 10)

    // Test with a 3x3 magic square
    checkAndRecord('isMagicSquare returns true for a 3x3 magic square', () => {
        if (!isMagicSquareExists) return false

        const magicSquare = [
            [2, 7, 6],
            [9, 5, 1],
            [4, 3, 8]
        ]
        
        const result = runFunction('isMagicSquare', [magicSquare])
        return result.success && result.returnValue === true
    }, 15)

    // Test with another known 3x3 magic square
    checkAndRecord('isMagicSquare returns true for another 3x3 magic square', () => {
        if (!isMagicSquareExists) return false

        const magicSquare = [
            [8, 1, 6],
            [3, 5, 7],
            [4, 9, 2]
        ]
        
        const result = runFunction('isMagicSquare', [magicSquare])
        return result.success && result.returnValue === true
    }, 15)

    // Test with a non-magic square (different row sums)
    checkAndRecord('isMagicSquare returns false for a matrix with different row sums', () => {
        if (!isMagicSquareExists) return false

        const nonMagicSquare = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ]
        
        const result = runFunction('isMagicSquare', [nonMagicSquare])
        return result.success && result.returnValue === false
    }, 10)

    // Test with a non-magic square (same row/column sums, different diagonal)
    checkAndRecord('isMagicSquare returns false when diagonals have different sums', () => {
        if (!isMagicSquareExists) return false

        const nonMagicSquare = [
            [3, 3, 3],
            [3, 3, 3],
            [3, 3, 4]
        ]
        
        const result = runFunction('isMagicSquare', [nonMagicSquare])
        return result.success && result.returnValue === false
    }, 10)

    // Test with a non-square matrix
    checkAndRecord('isMagicSquare returns false for a non-square matrix', () => {
        if (!isMagicSquareExists) return false

        const rectangularMatrix = [
            [1, 2, 3],
            [4, 5, 6]
        ]
        
        const result = runFunction('isMagicSquare', [rectangularMatrix])
        return result.success && result.returnValue === false
    }, 10)

    // Test with a single element matrix
    checkAndRecord('isMagicSquare returns true for a single element matrix', () => {
        if (!isMagicSquareExists) return false

        const singleElementMatrix = [[42]]
        
        const result = runFunction('isMagicSquare', [singleElementMatrix])
        return result.success && result.returnValue === true
    }, 10)

    // Test with an empty matrix
    checkAndRecord('isMagicSquare handles empty matrix correctly', () => {
        if (!isMagicSquareExists) return false

        const emptyMatrix = []
        
        const result = runFunction('isMagicSquare', [emptyMatrix])
        return result.success && result.returnValue === false
    }, 10)

    // Test with a 4x4 magic square
    checkAndRecord('isMagicSquare returns true for a 4x4 magic square', () => {
        if (!isMagicSquareExists) return false

        const magicSquare4x4 = [
            [16, 3, 2, 13],
            [5, 10, 11, 8],
            [9, 6, 7, 12],
            [4, 15, 14, 1]
        ]
        
        const result = runFunction('isMagicSquare', [magicSquare4x4])
        return result.success && result.returnValue === true
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 