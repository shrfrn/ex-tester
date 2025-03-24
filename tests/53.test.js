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

    // Check that required functions exist with correct parameters
    const createStudentsExists = hasFunctionWithSignature('createStudents', 0)
    const calcAverageGradeExists = hasFunctionWithSignature('calcAverageGrade', 1)
    const findWorstStudentExists = hasFunctionWithSignature('findWorstStudent', 1)
    const factorGradesExists = hasFunctionWithSignature('factorGrades', 1)
    const forEachExists = hasFunctionWithSignature('forEach', 2)
    
    // Check function definitions
    checkAndRecord('Function createStudents is defined correctly', () => {
        return createStudentsExists
    }, 10)
    
    checkAndRecord('Function calcAverageGrade is defined correctly', () => {
        return calcAverageGradeExists
    }, 10)
    
    checkAndRecord('Function findWorstStudent is defined correctly', () => {
        return findWorstStudentExists
    }, 10)
    
    checkAndRecord('Function factorGrades is defined correctly', () => {
        return factorGradesExists
    }, 10)
    
    checkAndRecord('Function forEach is defined correctly', () => {
        return forEachExists
    }, 10)

    // Test createStudents function with simulated input
    // Per exercise instructions:
    // 1. First collect all student names until 'quit'
    // 2. Then collect 3 grades for each student
    const createStudentsInputs = [
        "John",        // First student name
        "Alice",       // Second student name
        "quit",        // Stop collecting names
        // Now grades for each student (3 per student)
        "80", "85", "90",  // John's grades
        "75", "70", "80"   // Alice's grades
    ]
    
    // Always try to run the script with inputs, even if it might fail
    const testResult = runScript(studentCode, createStudentsInputs)
    
    // Check for correct prompting regardless of success
    checkAndRecord('createStudents prompts for student names and grades correctly', () => {
        if (!createStudentsExists) return false
        return testResult.callCounts && testResult.callCounts.prompt >= createStudentsInputs.length
    }, 10)

    // Create test data for function tests
    const testStudents = [
        { name: 'John', grades: [85, 90, 88] },
        { name: 'Alice', grades: [75, 80, 82] },
        { name: 'Bob', grades: [95, 92, 98] },
        { name: 'Eve', grades: [70, 65, 68] }
    ]

    // Test calcAverageGrade function
    const averageGradeResults = {}
    if (calcAverageGradeExists) {
        testStudents.forEach(student => {
            const avgGradeResult = runFunction('calcAverageGrade', [student])
            if (avgGradeResult.success) {
                averageGradeResults[student.name] = avgGradeResult.returnValue
            }
        })
    }
    
    checkAndRecord('calcAverageGrade calculates student average grade correctly', () => {
        if (!calcAverageGradeExists) return false
        
        // Expected averages
        const expectedAverages = {
            'John': 87.67,   // (85 + 90 + 88) / 3
            'Alice': 79,     // (75 + 80 + 82) / 3
            'Bob': 95,       // (95 + 92 + 98) / 3
            'Eve': 67.67     // (70 + 65 + 68) / 3
        }
        
        // Check each student's average with some tolerance for floating point
        return Object.keys(expectedAverages).every(name => {
            const expected = expectedAverages[name]
            const actual = averageGradeResults[name]
            return Math.abs(expected - actual) < 0.1
        })
    }, 10)

    // Test findWorstStudent function
    let worstStudentResult = null
    if (findWorstStudentExists) {
        const worstResult = runFunction('findWorstStudent', [testStudents])
        worstStudentResult = worstResult.success ? worstResult.returnValue : null
    }
    
    checkAndRecord('findWorstStudent identifies student with lowest average grade', () => {
        if (!findWorstStudentExists) return false
        
        // Eve has the lowest average
        return worstStudentResult && worstStudentResult.name === 'Eve'
    }, 10)

    // Test factorGrades function
    let factoredStudent = null
    if (factorGradesExists) {
        const factorResult = runFunction('factorGrades', [{ 
            name: 'John', 
            grades: [85, 90, 88] 
        }])
        
        factoredStudent = factorResult.success ? factorResult.returnValue : null
    }
    
    checkAndRecord('factorGrades adds 5% to all grades correctly', () => {
        if (!factorGradesExists) return false
        
        // Expected factored grades for John
        const expectedGrades = [89.25, 94.5, 92.4]  // 85*1.05, 90*1.05, 88*1.05
        
        if (!factoredStudent || !factoredStudent.grades) return false
        
        // Check each grade with some tolerance for floating point
        return factoredStudent.grades.every((grade, index) => {
            return Math.abs(grade - expectedGrades[index]) < 0.1
        })
    }, 10)

    // Test forEach function
    let forEachResult = false
    if (forEachExists) {
        // Create a test function that counts how many students it processes
        let processedCount = 0
        const testFunc = () => { processedCount++ }
        
        const forEachTestResult = runFunction('forEach', [testStudents, testFunc])
        
        forEachResult = processedCount === testStudents.length
    }
    
    checkAndRecord('forEach correctly applies a function to each student', () => {
        if (!forEachExists) return false
        return forEachResult
    }, 10)
    
    checkAndRecord('Uses forEach to implement findWorstStudent', () => {
        if (!findWorstStudentExists || !forEachExists) return false
        
        const findWorstFunctionBody = studentCode.match(/function\s+findWorstStudent\s*\([^)]*\)\s*{([^}]*)}/s)
        if (!findWorstFunctionBody) return false
        
        return findWorstFunctionBody[1].includes('forEach')
    }, 10)
    
    checkAndRecord('Uses forEach to apply factorGrades to all students', () => {
        return studentCode.includes('forEach') && studentCode.includes('factorGrades')
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 