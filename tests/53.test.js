import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode, ["TestUser", "quit", "80", "85", "90"])
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that required functions exist with correct parameters
    const createStudentsExists = hasFunctionWithSignature('createStudents', 0)
    const calcAverageGradeExists = hasFunctionWithSignature('calcAverageGrade', 1)
    const findWorstStudentExists = hasFunctionWithSignature('findWorstStudent', 1)
    const factorGradesExists = hasFunctionWithSignature('factorGrades', 1)
    const forEachExists = hasFunctionWithSignature('forEach', 2)
    
    // Check function definitions
    checkAndRecord('Function createStudents is defined correctly',  createStudentsExists, 10)
    checkAndRecord('Function calcAverageGrade is defined correctly', calcAverageGradeExists, 10)
    checkAndRecord('Function findWorstStudent is defined correctly', findWorstStudentExists, 10)
    checkAndRecord('Function factorGrades is defined correctly', factorGradesExists, 10)
    checkAndRecord('Function forEach is defined correctly', forEachExists, 10)

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
    
    // Check for correct prompting
    checkAndRecord('createStudents prompts for student names and grades correctly', () => {
        if (!createStudentsExists) return false

        const testResult = runScript(studentCode, createStudentsInputs)
        return testResult.callCounts && testResult.callCounts?.prompt >= createStudentsInputs.length
    }, 10)

    // Create test data for function tests
    const testStudents = [
        { name: 'John', grades: [85, 90, 88] },
        { name: 'Alice', grades: [75, 80, 82] },
        { name: 'Bob', grades: [95, 92, 98] },
        { name: 'Eve', grades: [70, 65, 68] }
    ]

    // Test calcAverageGrade function
    checkAndRecord('calcAverageGrade calculates student average grade correctly', () => {
        const averageGradeResults = {}
        
        if (!calcAverageGradeExists) return false
        
        testStudents.forEach(student => {
            const avgGradeResult = runFunction('calcAverageGrade', [student])
            if (avgGradeResult.success) {
                averageGradeResults[student.name] = avgGradeResult.returnValue
            }
        })

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
    checkAndRecord('findWorstStudent identifies student with lowest average grade', () => {
        if (!findWorstStudentExists) return false

        const worstResult = runFunction('findWorstStudent', [testStudents])
        const worstStudentResult = worstResult.success ? worstResult.returnValue : null
        
        // Eve has the lowest average
        return worstStudentResult?.name === 'Eve'
    }, 10)

    // Test factorGrades function
    
    checkAndRecord('factorGrades adds 5% to all grades correctly', () => {
        if (!factorGradesExists) return false
        
        const testStudent = { name: 'John', grades: [85, 90, 88] }
        const factorResult = runFunction('factorGrades', [testStudent])
        
        if (!factorResult.success) return false
        
        // Expected factored grades for John
        const expectedGrades = [89.25, 94.5, 92.4]  // 85*1.05, 90*1.05, 88*1.05
        
        // Check each grade with some tolerance for floating point
        return testStudent.grades.every((grade, index) => 
            Math.abs(grade - expectedGrades[index]) < 0.1)
    }, 10)

    // Test forEach function
    
    checkAndRecord('forEach correctly applies a function to each student', () => {
        if (!forEachExists) return false

        // Create a test function that counts how many students it processes
        let processedCount = 0
        const testFunc = () => { processedCount++ }
        
        const forEachTestResult = runFunction('forEach', [testStudents, testFunc])
        if (!forEachTestResult.success) return false

        return processedCount === testStudents.length
    }, 20)
    
    checkAndRecord('forEach passes student objects to the callback function', () => {
        if (!forEachExists) return false
        
        // Create test array to collect student names
        const collectedNames = []
        
        // Create a test function that collects student names
        const nameCollector = student => {
            if (student && student.name) {
                collectedNames.push(student.name)
            }
        }
        
        const forEachTestResult = runFunction('forEach', [testStudents, nameCollector])
        if (!forEachTestResult.success) return false
        
        // Check if all expected student names were collected
        const expectedNames = testStudents.map(student => student.name)
        return expectedNames.length === collectedNames.length &&
               expectedNames.every(name => collectedNames.includes(name))
    }, 20)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 