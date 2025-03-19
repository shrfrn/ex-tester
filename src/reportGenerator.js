import fs from 'fs'
import path from 'path'

// Generate markdown report from test results
const generateReport = (studentResults) => {
  // Categorize students based on normalizedScore
  const categories = {
    '⭐⭐⭐⭐⭐': [],
    '⭐⭐⭐⭐': [],
    '⭐⭐⭐': [],
    '⭐⭐': [],
    '⭐': [],
    'No Stars': []
  }
  
  for (const student of studentResults) {
    const score = student.scores.normalizedScore
    
    if (score >= 91) categories['⭐⭐⭐⭐⭐'].push(student)
    else if (score >= 81) categories['⭐⭐⭐⭐'].push(student)
    else if (score >= 71) categories['⭐⭐⭐'].push(student)
    else if (score >= 61) categories['⭐⭐'].push(student)
    else if (score >= 51) categories['⭐'].push(student)
    else categories['No Stars'].push(student)
  }
  
  // Start building the report
  let report = '# Student Assignment Evaluation Report\n\n'
  
  // Generate report sections for each category
  for (const [category, studentsInCategory] of Object.entries(categories)) {
    if (studentsInCategory.length > 0) {
      report += `## ${category} (${getCategoryScoreRange(category)})\n\n`
      
      // Create table header
      report += '| Name | Exercises Submitted | Submission % | Success Rate | Score | Folder |\n'
      report += '|------|---------------------|-------------|-------------|-------|--------|\n'
      
      // Add each student to the table
      for (const student of studentsInCategory) {
        // Format exercises submitted as ranges
        const exercises = formatExerciseList(Object.keys(student.testResults).map(Number).sort((a, b) => a - b))
        
        const exercisesSubmitted = `${exercises} (${student.scores.totalExercises})`
        const submissionRate = `${Math.round(student.scores.submissionRate * 100)}%`
        const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
        const score = student.scores.normalizedScore
        const link = `[Folder](file://${student.folderPath})`
        
        report += `| ${student.name} | ${exercisesSubmitted} | ${submissionRate} | ${successRate} | ${score} | ${link} |\n`
      }
      
      report += '\n'
    }
  }
  
  // Save the report
  const outputPath = path.join(process.cwd(), 'student-report.md')
  fs.writeFileSync(outputPath, report)
  console.log(`Report saved to: ${outputPath}`)
  
  return report
}

// Format a list of exercise numbers into a compact representation (e.g. [1,2,3,5,6,7,10] -> "1-3, 5-7, 10")
function formatExerciseList(exercises) {
  if (!exercises || exercises.length === 0) return ''
  
  const ranges = []
  let rangeStart = exercises[0]
  let rangeEnd = exercises[0]
  
  for (let i = 1; i < exercises.length; i++) {
    if (exercises[i] === rangeEnd + 1) {
      rangeEnd = exercises[i]
    } else {
      // End of a range
      if (rangeStart === rangeEnd) {
        ranges.push(`${rangeStart}`)
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`)
      }
      rangeStart = rangeEnd = exercises[i]
    }
  }
  
  // Add the last range
  if (rangeStart === rangeEnd) {
    ranges.push(`${rangeStart}`)
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`)
  }
  
  return ranges.join(', ')
}

// Save report to file
const saveReport = (report, outputPath) => {
  fs.writeFileSync(outputPath, report)
  console.log(`Report saved to: ${outputPath}`)
}

// Helper function to get score range for a category
function getCategoryScoreRange(category) {
  switch(category) {
    case '⭐⭐⭐⭐⭐': return '91-100'
    case '⭐⭐⭐⭐': return '81-90'
    case '⭐⭐⭐': return '71-80'
    case '⭐⭐': return '61-70'
    case '⭐': return '51-60'
    case 'No Stars': return 'Below 51'
    default: return ''
  }
}

export {
  generateReport,
  saveReport
} 