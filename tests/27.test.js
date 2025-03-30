// The exercise definition is very hard to test because it asks the students to 
// write one implementation and then refactor it so there is no real way of telling 
// whether the first part was implemented correctly. Additionally, the students are 
// asked to give the functions in the first part a specific name 
// and to choose a name for functions in the second part which makes it very difficult 
// to test for the existence of the functions they are asked to implement in the second 
// part. We need to consider rephrasing instructions in the exercise.
// TODO: This test needs to be reviewed.

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

    // Check if all required functions exist with correct parameters
    const functionsToCheck = [
        { name: 'getAsterisks', params: 1, description: 'getAsterisks function with 1 parameter', points: 10 },
        { name: 'getTriangle', params: 1, description: 'getTriangle function with 1 parameter', points: 10 },
        { name: 'getMusicEqualizer', params: 1, description: 'getMusicEqualizer function with 1 parameter', points: 10 },
        { name: 'getBlock', params: 2, description: 'getBlock function with 2 parameters', points: 10 },
        { name: 'getBlockOutline', params: 2, description: 'getBlockOutline function with 2 parameters', points: 10 }
    ]

    // Alternative function names for Part V (character support)
    const alternativeFunctions = [
        { name: 'getCharacters', params: 2, description: 'Function for generating character sequences', points: 0 },
        { name: 'getCharacterTriangle', params: 2, description: 'Function for generating character triangles', points: 0 },
        { name: 'getCharacterEqualizer', params: 2, description: 'Function for generating character equalizers', points: 0 },
        { name: 'getCharacterBlock', params: 3, description: 'Function for generating character blocks', points: 0 },
        { name: 'getCharacterBlockOutline', params: 3, description: 'Function for generating character block outlines', points: 0 }
    ]

    // Check existence of each function
    const functionExistsMap = {}
    functionsToCheck.forEach(func => {
        functionExistsMap[func.name] = hasFunctionWithSignature(func.name, func.params)
        checkAndRecord(`Function ${func.description} exists`, () => {
            return functionExistsMap[func.name]
        }, func.points)
    })

    // Check alternative functions for Part V
    const alternativeFunctionExistsMap = {}
    alternativeFunctions.forEach(func => {
        alternativeFunctionExistsMap[func.name] = hasFunctionWithSignature(func.name, func.params)
    })

    // Part V implementation check
    const hasPartVImplementation = Object.values(alternativeFunctionExistsMap).some(exists => exists)
    checkAndRecord('Part V: Character support implementation', () => {
        return hasPartVImplementation
    }, 10)

    // Test Part I: Basic Asterisks
    if (functionExistsMap['getAsterisks']) {
        const testCases = [
            { input: [3], expected: '***', description: 'getAsterisks(3) returns "***"', points: 5 },
            { input: [5], expected: '*****', description: 'getAsterisks(5) returns "*****"', points: 5 },
            { input: [0], expected: '', description: 'getAsterisks(0) returns ""', points: 5 }
        ]
        
        testCases.forEach(testCase => {
            const result = runFunction('getAsterisks', testCase.input)
            checkAndRecord(testCase.description, () => {
                if (!result.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(result.returnValue, 'string')) return false
                
                return result.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        // Mark as failed if function doesn't exist
        checkAndRecord('getAsterisks(3) returns "***"', () => false, 5)
        checkAndRecord('getAsterisks(5) returns "*****"', () => false, 5)
        checkAndRecord('getAsterisks(0) returns ""', () => false, 5)
    }

    // Test Part II: Triangle Pattern
    if (functionExistsMap['getTriangle']) {
        const testCases = [
            { 
                input: [3], 
                expected: '*\n**\n***\n**\n*\n', 
                description: 'getTriangle(3) returns correct triangle pattern', 
                points: 10 
            },
            { 
                input: [2], 
                expected: '*\n**\n*\n', 
                description: 'getTriangle(2) returns correct triangle pattern', 
                points: 5 
            }
        ]
        
        testCases.forEach(testCase => {
            const result = runFunction('getTriangle', testCase.input)
            checkAndRecord(testCase.description, () => {
                if (!result.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(result.returnValue, 'string')) return false
                
                return result.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        checkAndRecord('getTriangle(3) returns correct triangle pattern', () => false, 10)
        checkAndRecord('getTriangle(2) returns correct triangle pattern', () => false, 5)
    }

    // Test Part III: Music Equalizer
    if (functionExistsMap['getMusicEqualizer']) {
        const result = runFunction('getMusicEqualizer', [5])
        
        checkAndRecord('getMusicEqualizer(5) returns a string with 5 lines', () => {
            if (!result.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(result.returnValue, 'string')) return false
            
            const lines = result.returnValue.split('\n').filter(line => line.length > 0)
            return lines.length === 5
        }, 7)
        
        checkAndRecord('getMusicEqualizer produces random-length asterisk sequences between 1-10', () => {
            if (!result.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(result.returnValue, 'string')) return false
            
            const lines = result.returnValue.split('\n').filter(line => line.length > 0)
            return lines.every(line => {
                const length = line.length
                return line === '*'.repeat(length) && length >= 1 && length <= 10
            })
        }, 8)
    } else {
        checkAndRecord('getMusicEqualizer(5) returns a string with 5 lines', () => false, 7)
        checkAndRecord('getMusicEqualizer produces random-length asterisk sequences between 1-10', () => false, 8)
    }

    // Test Part IV: Block Patterns
    if (functionExistsMap['getBlock']) {
        const testCases = [
            { 
                input: [3, 4], 
                expected: '****\n****\n****\n', 
                description: 'getBlock(3, 4) returns correct block pattern', 
                points: 10 
            }
        ]
        
        testCases.forEach(testCase => {
            const result = runFunction('getBlock', testCase.input)
            checkAndRecord(testCase.description, () => {
                if (!result.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(result.returnValue, 'string')) return false
                
                return result.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        checkAndRecord('getBlock(3, 4) returns correct block pattern', () => false, 10)
    }

    if (functionExistsMap['getBlockOutline']) {
        const testCases = [
            { 
                input: [4, 5], 
                expected: '*****\n*   *\n*   *\n*****\n', 
                description: 'getBlockOutline(4, 5) returns correct block outline pattern', 
                points: 15 
            },
            { 
                input: [3, 3], 
                expected: '***\n* *\n***\n', 
                description: 'getBlockOutline(3, 3) returns correct block outline pattern', 
                points: 10 
            }
        ]
        
        testCases.forEach(testCase => {
            const result = runFunction('getBlockOutline', testCase.input)
            checkAndRecord(testCase.description, () => {
                if (!result.success) return false
                
                // Check that returnValue has the expected type before operating on it
                if (!checkReturnValueType(result.returnValue, 'string')) return false
                
                return result.returnValue === testCase.expected
            }, testCase.points)
        })
    } else {
        checkAndRecord('getBlockOutline(4, 5) returns correct block outline pattern', () => false, 15)
        checkAndRecord('getBlockOutline(3, 3) returns correct block outline pattern', () => false, 10)
    }

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 