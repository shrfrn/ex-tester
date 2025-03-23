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

    // Check that both required functions exist with correct parameters
    const getWordExists = hasFunctionWithSignature('getWord', 0)
    const getLoremIpsumExists = hasFunctionWithSignature('getLoremIpsum', 1)

    checkAndRecord('Function getWord is defined correctly with 0 parameters', getWordExists, 20)
    checkAndRecord('Function getLoremIpsum is defined correctly with 1 parameter', getLoremIpsumExists, 20)

    // Define getWord tests
    const wordResult = getWordExists ? runFunction('getWord', []) : { success: false, returnValue: null }
    
    // Run multiple getWord calls to test randomness
    const words = []
    if (getWordExists) {
        for (let i = 0; i < 10; i++) {
            const result = runFunction('getWord', [])
            if (result.success) words.push(result.returnValue)
        }
    }

    // Define all getWord test cases
    const getWordTests = [
        { 
            description: 'getWord returns a string', 
            testFn: () => getWordExists && wordResult.success && typeof wordResult.returnValue === 'string',
            points: 10 
        },
        { 
            description: 'getWord returns a word of length 3-5 characters', 
            testFn: () => getWordExists && wordResult.success && 
                          wordResult.returnValue.length >= 3 && 
                          wordResult.returnValue.length <= 5,
            points: 10 
        },
        { 
            description: 'getWord returns a word containing only letters', 
            testFn: () => getWordExists && wordResult.success && 
                          /^[a-zA-Z]+$/.test(wordResult.returnValue),
            points: 10 
        },
        { 
            description: 'getWord generates different words on different calls', 
            testFn: () => getWordExists && words.length >= 2 && 
                          new Set(words).size > 1,
            points: 10 
        }
    ]

    // Run all getWord tests
    getWordTests.forEach(test => 
        checkAndRecord(test.description, test.testFn, test.points))

    // Test the getLoremIpsum function
    const loremIpsumTests = [
        { input: [5], description: 'getLoremIpsum(5) returns a string with 5 words', points: 10 },
        { input: [10], description: 'getLoremIpsum(10) returns a string with 10 words', points: 10 },
        { input: [1], description: 'getLoremIpsum(1) returns a string with 1 word', points: 10 }
    ]

    // Test each loremIpsum case
    loremIpsumTests.forEach(testCase => {
        const testResult = getLoremIpsumExists 
            ? runFunction('getLoremIpsum', testCase.input)
            : { success: false, returnValue: null }
        
        const wordCount = testCase.input[0]
        
        checkAndRecord(testCase.description, () => {
            if (!getLoremIpsumExists || !testResult.success) return false
            
            const loremText = testResult.returnValue
            
            // Check that it's a string
            if (typeof loremText !== 'string') return false
            
            // Count the words (split by spaces)
            const words = loremText.trim().split(/\s+/)
            return words.length === wordCount
            
        }, testCase.points)
    })

    // Test that getLoremIpsum uses getWord
    checkAndRecord('getLoremIpsum uses words that match the pattern from getWord', () => {
        if (!getWordExists || !getLoremIpsumExists) return false
        
        const loremResult = runFunction('getLoremIpsum', [5])
        if (!loremResult.success) return false
        
        const words = loremResult.returnValue.trim().split(/\s+/)
        
        // Check that all words follow the pattern of getWord (3-5 letters)
        return words.every(word => 
            word.length >= 3 && 
            word.length <= 5 && 
            /^[a-zA-Z]+$/.test(word)
        )
    }, 10)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 