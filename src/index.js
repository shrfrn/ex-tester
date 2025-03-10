import path from 'path'
import promptSync from 'prompt-sync'
import { parseAssignmentFiles, findStudentFolders, getStudentExercises } from './fileUtils.js'
import { testStudentExercises } from './testRunner.js'
import { analyzeStudentCodeQuality } from './codeAnalyzer.js'
import { generateReport, saveReport } from './reportGenerator.js'

const prompt = promptSync({ sigint: true })

const main = async () => {
  console.log('Student Assignment Testing Suite')
  console.log('==============================\n')
  
  // Get assignment path from config or use default
  const assignmentsPath = '/Volumes/Extreme 2T/Dropbox/Teaching/JS-Basics'
  console.log(`Reading assignments from: ${assignmentsPath}`)
  
  // Get submissions folder from user
  const submissionsPath = prompt('Enter the path to the student submissions folder: ')
  if (!submissionsPath) {
    console.error('No submissions path provided. Exiting.')
    return
  }
  
  // Get exercise range from user
  const exerciseRangeInput = prompt('Enter the range of exercises to test (e.g., 1-10): ')
  if (!exerciseRangeInput) {
    console.error('No exercise range provided. Exiting.')
    return
  }
  
  // Parse exercise range
  const [start, end] = exerciseRangeInput.split('-').map(num => parseInt(num.trim()))
  if (isNaN(start) || isNaN(end) || start > end) {
    console.error('Invalid exercise range. Exiting.')
    return
  }
  
  console.log(`\nProcessing exercises ${start} to ${end}...`)
  
  try {
    // Parse assignment requirements
    console.log('Parsing assignment files...')
    const assignments = await parseAssignmentFiles(assignmentsPath)
    const assignmentRequirements = {}
    assignments.forEach(assignment => {
      assignmentRequirements[assignment.id] = assignment.expectedBehavior
    })
    
    // Find student folders
    console.log('Finding student submission folders...')
    const studentFolders = await findStudentFolders(submissionsPath)
    console.log(`Found ${studentFolders.length} student folders.`)
    
    // Process each student
    const studentResults = []
    
    for (const [index, student] of studentFolders.entries()) {
      console.log(`Processing student ${index + 1}/${studentFolders.length}: ${student.name}`)
      
      // Get exercise files
      const exerciseFiles = await getStudentExercises(student.path)
      
      // Run tests
      const testResults = await testStudentExercises(
        student.path,
        exerciseFiles,
        assignmentRequirements,
        [start, end]
      )
      
      // Analyze code quality
      const codeQualityResults = await analyzeStudentCodeQuality(student.path, exerciseFiles)
      
      // Calculate metrics
      const exercisesInRange = Object.keys(testResults)
        .filter(key => {
          const num = parseInt(key)
          return num >= start && num <= end
        })
      
      const submittedExercises = exercisesInRange.filter(key => 
        testResults[key].submitted !== false)
      
      const runningExercises = submittedExercises.filter(key => 
        testResults[key].runs === true)
      
      const correctExercises = submittedExercises.filter(key => 
        testResults[key].correct === true)
      
      // Calculate percentages
      const runPercent = Math.round((runningExercises.length / submittedExercises.length) * 100) || 0
      const correctPercent = Math.round((correctExercises.length / submittedExercises.length) * 100) || 0
      
      // Add to results
      studentResults.push({
        name: student.name,
        folderPath: student.path,
        exercisesSubmitted: submittedExercises.map(ex => parseInt(ex)),
        runPercent,
        correctPercent,
        codeQuality: codeQualityResults.overallScore,
        testResults,
        qualityResults: codeQualityResults
      })
    }
    
    // Generate and save report
    console.log('\nGenerating report...')
    const report = generateReport(studentResults, submissionsPath, [start, end])
    
    const outputPath = path.join(process.cwd(), 'student-evaluation-report.md')
    saveReport(report, outputPath)
    
    console.log('\nEvaluation complete!')
  } catch (error) {
    console.error('Error during evaluation:', error)
  }
}

// Start the program
main() 