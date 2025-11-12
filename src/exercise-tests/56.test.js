import { runScript, runFunction } from '../services/code-runner.service.js'
import { hasFunctionWithSignature } from '../services/type-checker.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(originalCode)
    if (!result.success) return executionFailed(result, originalCode)

    // Check that required function exists with correct parameters
    const checkIfSymmetricExists = hasFunctionWithSignature('checkIfSymmetric', 1)
    
    // Check function definition
    checkAndRecord('Function checkIfSymmetric is defined correctly', checkIfSymmetricExists, 10)

    // Test with a symmetric matrix
    checkAndRecord('checkIfSymmetric returns true for a symmetric matrix', () => {
        if (!checkIfSymmetricExists) return false

        const symmetricMatrix = [
            [1, 2, 3],
            [2, 4, 5],
            [3, 5, 6]
        ]
        
        const result = runFunction('checkIfSymmetric', [symmetricMatrix])
        return result.success && result.returnValue === true
    }, 20)

    // Test with a non-symmetric matrix
    checkAndRecord('checkIfSymmetric returns false for a non-symmetric matrix', () => {
        if (!checkIfSymmetricExists) return false

        const nonSymmetricMatrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ]
        
        const result = runFunction('checkIfSymmetric', [nonSymmetricMatrix])
        return result.success && result.returnValue === false
    }, 20)

    // Test with a single element matrix
    checkAndRecord('checkIfSymmetric returns true for a single element matrix', () => {
        if (!checkIfSymmetricExists) return false

        const singleElementMatrix = [[42]]
        
        const result = runFunction('checkIfSymmetric', [singleElementMatrix])
        return result.success && result.returnValue === true
    }, 10)

    // Test with an empty matrix
    checkAndRecord('checkIfSymmetric handles empty matrix correctly', () => {
        if (!checkIfSymmetricExists) return false

        const emptyMatrix = []
        
        const result = runFunction('checkIfSymmetric', [emptyMatrix])
        return result.success && result.returnValue === true
    }, 10)

    // Test with a rectangular (non-square) matrix
    checkAndRecord('checkIfSymmetric returns false for a non-square matrix', () => {
        if (!checkIfSymmetricExists) return false

        const rectangularMatrix = [
            [1, 2, 3],
            [4, 5, 6]
        ]
        
        const result = runFunction('checkIfSymmetric', [rectangularMatrix])
        return result.success && result.returnValue === false
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 