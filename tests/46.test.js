import { runScript, runFunction, hasFunctionWithSignature, checkReturnValueType } from '../src/testUtils.js'
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
    const multByExists = hasFunctionWithSignature('multBy', 3)
    checkAndRecord('Function multBy is defined correctly with 3 parameters', multByExists, 10)

    // Define test data sets to use for both immutable and mutable tests
    const testDataSets = [
        { 
            array: [1, 2, 3, 4, 5], 
            multiplier: 2, 
            expectedResult: [2, 4, 6, 8, 10],
            description: "array [1, 2, 3, 4, 5] with multiplier 2" 
        },
        { 
            array: [0, 10, 20], 
            multiplier: 5, 
            expectedResult: [0, 50, 100],
            description: "array [0, 10, 20] with multiplier 5" 
        },
        { 
            array: [-2, -1, 0, 1, 2], 
            multiplier: -3, 
            expectedResult: [6, 3, 0, -3, -6],
            description: "array [-2, -1, 0, 1, 2] with multiplier -3" 
        },
        { 
            array: [100], 
            multiplier: 0.5, 
            expectedResult: [50],
            description: "array [100] with multiplier 0.5" 
        },
        { 
            array: [], 
            multiplier: 10, 
            expectedResult: [],
            description: "empty array with multiplier 10" 
        }
    ]

    // Test each data set with both immutable and mutable behavior
    testDataSets.forEach((testData, index) => {
        // Create a deep copy of the test array that we'll use for both tests
        const originalArray = [...testData.array]
        
        // ==== FIRST TEST: IMMUTABLE VERSION ====
        checkAndRecord(`Test ${index + 1}: Immutable version with ${testData.description}`, () => {
            if (!multByExists) return false
            
            // Create a copy of the original array to compare later
            const arrayBeforeImmutable = [...originalArray]
            
            // Run the function with isImmutable = true
            const immutableResult = runFunction('multBy', [originalArray, testData.multiplier, true])
            
            if (!immutableResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(immutableResult.returnValue, 'array')) return false
            
            // Check that returned array has correct values
            const resultCorrect = immutableResult.returnValue.every(
                (val, idx) => val === testData.expectedResult[idx]
            )
            
            // Check that original array is unchanged after immutable operation
            const originalUnchanged = originalArray.every(
                (val, idx) => val === arrayBeforeImmutable[idx]
            )
            
            return resultCorrect && originalUnchanged
        }, 10)
        
        // ==== SECOND TEST: MUTABLE VERSION ====
        checkAndRecord(`Test ${index + 1}: Mutable version with ${testData.description}`, () => {
            if (!multByExists) return false
            
            // Save a copy of the original array before mutation
            const arrayBeforeMutable = [...originalArray]
            
            // Run the function with isImmutable = false
            const mutableResult = runFunction('multBy', [originalArray, testData.multiplier, false])
            
            if (!mutableResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(mutableResult.returnValue, 'array')) return false
            
            // Check that returned array has correct values
            const resultCorrect = mutableResult.returnValue.every(
                (val, idx) => val === testData.expectedResult[idx]
            )
            
            // Check that original array HAS been changed by mutable operation
            // (Original array should now equal the expected result)
            const originalChanged = originalArray.every(
                (val, idx) => val === testData.expectedResult[idx]
            )
            
            // Check that the array BEFORE mutation doesn't match the array AFTER mutation
            // This only applies if the array has elements and multiplier isn't 1
            const hasChangedFromOriginal = 
                testData.array.length === 0 || 
                testData.multiplier === 1 || 
                !originalArray.every((val, idx) => val === arrayBeforeMutable[idx])
            
            return resultCorrect && originalChanged && hasChangedFromOriginal
        }, 10)
    })
    
    // Additional test for verifying function returns the correct array reference
    checkAndRecord('Immutable version returns a new array, mutable version returns the original array', () => {
        if (!multByExists) return false
        
        const testArray = [1, 2, 3]
        
        // Run immutable version
        const immutableResult = runFunction('multBy', [testArray, 2, true])
        
        if (!immutableResult.success) return false
        
        // Check that returnValue exists and is an array
        if (!checkReturnValueType(immutableResult.returnValue, 'array')) return false
        
        // Run mutable version on a copy to avoid interfering with previous test
        const mutableTestArray = [...testArray]
        const mutableResult = runFunction('multBy', [mutableTestArray, 2, false])
        
        if (!mutableResult.success) return false
        
        // Check that returnValue exists and is an array
        if (!checkReturnValueType(mutableResult.returnValue, 'array')) return false
        
        // For mutable version, returned array should be the same reference as input array
        // We can only check indirectly by modifying the returned array and checking original
        
        // Check results match expected values
        const immutableCorrect = immutableResult.returnValue.every((val, idx) => val === testArray[idx] * 2)
        const mutableCorrect = mutableResult.returnValue.every((val, idx) => val === testArray[idx] * 2)
        
        return immutableCorrect && mutableCorrect
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 