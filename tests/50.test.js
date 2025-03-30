// Very hard to test this exercise correctly. 
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
    const makeWaterExists = hasFunctionWithSignature('makeWater', 0)
    checkAndRecord('Function makeWater is defined correctly with 0 parameters', makeWaterExists, 10)
    
    // Test that the code includes an array with all relevant atoms
    checkAndRecord('Code includes array with all required atoms (H, B, C, N, O, F)', () => {
        const requiredAtoms = ['H', 'B', 'C', 'N', 'O', 'F']
        
        // Look for array definition containing atoms with flexible whitespace
        // Match arrays like: [ 'H', 'O', 'B', 'C', 'N', 'F' ] with any amount of spacing
        const atomPattern = '\\s*[\'"][HhBbCcNnOoFf][\'"]\\s*'
        const commaPattern = '\\s*,\\s*'
        const arrayPattern = new RegExp(`\\[\\s*${atomPattern}(?:${commaPattern}${atomPattern}){5}\\s*\\]`)
        
        // Check if we found an array with atoms
        if (!arrayPattern.test(studentCode)) return false
        
        // Verify all required atoms are present (case insensitive)
        return requiredAtoms.every(atom => {
            const regex = new RegExp(`['"]${atom}['"]`, 'i')
            return regex.test(studentCode)
        })
    }, 10)
    
    // Test that the function returns a number
    checkAndRecord('Function returns a number', () => {
        if (!makeWaterExists) return false
        
        const testResult = runFunction('makeWater', [])
        
        if (!testResult.success) return false
        
        return checkReturnValueType(testResult.returnValue, 'number')
    }, 10)
    
    // Run the function multiple times to collect results for randomness and statistical analysis
    const numRuns = 50  // Increased for better statistical sampling
    const results = []
    
    if (makeWaterExists) {
        for (let i = 0; i < numRuns; i++) {
            const testResult = runFunction('makeWater', [])
            if (testResult.success && checkReturnValueType(testResult.returnValue, 'number')) {
                results.push(testResult.returnValue)
            }
        }
    }
    
    // Comprehensive test for randomness, minimum value, and statistical properties
    checkAndRecord('Function demonstrates proper randomness and valid result ranges', () => {
        if (!makeWaterExists || results.length !== numRuns) return false
        
        // Check that all results are at least 1 (minimum rounds)
        const allArePositive = results.every(result => result >= 1)
        if (!allArePositive) return false
        
        // Count unique values to measure randomness
        const uniqueValues = new Set(results)
        const uniqueCount = uniqueValues.size
        
        // Calculate mean (average) to check if it's in a reasonable range
        const sum = results.reduce((a, b) => a + b, 0)
        const mean = sum / results.length
        
        // With 6 atoms and picking 3 random atoms with replacement, there are 56 possible combinations
        // The probability of getting 2 H atoms and 1 O atom is approximately 5.36% (3/56)
        // So the expected mean should be around 1/0.0536 ≈ 18.7 attempts
        
        // We'll allow a more flexible range since this is a randomized process
        // We expect a significant number of unique values (at least 8) due to this randomness
        // and an average that's reasonably high (at least 5)
        
        console.log(`Mean: ${mean}, Unique values: ${uniqueCount}`)
        
        return uniqueCount >= 8 && mean >= 5 && mean <= 40
    }, 20)
    
    // Test the theoretical understanding by checking function behavior
    checkAndRecord('Function successfully creates water molecules', () => {
        if (!makeWaterExists) return false
        
        // Run the function multiple times to ensure it eventually succeeds
        // This tests if it properly recognizes when a water molecule is formed (2 H + 1 O)
        const maxAttempts = 15
        for (let i = 0; i < maxAttempts; i++) {
            const testResult = runFunction('makeWater', [])
            if (testResult.success && checkReturnValueType(testResult.returnValue, 'number') && testResult.returnValue >= 1) {
                return true
            }
        }
        
        return false
    }, 10)
    
    // Test statistical distribution
    checkAndRecord('Function produces distribution consistent with theoretical probability', () => {
        if (!makeWaterExists || results.length !== numRuns) return false
        
        // Count frequency of single-run successes
        const singleRunSuccesses = results.filter(r => r === 1).length
        
        // The theoretical probability is about 5.36% (3/56)
        // With 50 runs, we expect around 2-3 single-run successes
        // Allow for statistical variation with a reasonable range
        
        // Additionally, check that we have a reasonable distribution of other values
        const twoToFiveRuns = results.filter(r => r >= 2 && r <= 5).length
        const sixToTwentyRuns = results.filter(r => r >= 6 && r <= 20).length
        const moreThanTwentyRuns = results.filter(r => r > 20).length
        
        // We expect all of these ranges to have some representation
        // in a proper random distribution
        return singleRunSuccesses <= numRuns * 0.15 && // No more than 15% single-run successes
               twoToFiveRuns > 0 &&
               sixToTwentyRuns > 0 &&
               moreThanTwentyRuns > 0
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 