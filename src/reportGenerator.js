import fs from 'fs'
import path from 'path'

// Generate markdown report from test results
const generateReport = (students, submissionPath, exerciseRange) => {
  // Categorize students into 5 stars to 1 star
  const categories = {
    '5★': [],
    '4★': [],
    '3★': [],
    '2★': [],
    '1★': []
  }
  
  for (const student of students) {
    const category = calculateStudentCategory(student)
    categories[category].push(student)
  }
  
  // Start building the report
  let report = '# Student Assignment Evaluation Report\n\n'
  
  // Add exercise range information
  report += `## Exercises evaluated: ${exerciseRange[0]} to ${exerciseRange[1]}\n\n`
  
  // Generate report sections for each category
  for (const [category, studentsInCategory] of Object.entries(categories)) {
    if (studentsInCategory.length > 0) {
      report += `## ${category} Students\n\n`
      
      // Create table header
      report += '| Student Name | Exercises Submitted | Run % | Correctness % | Code Quality | Link |\n'
      report += '|--------------|---------------------|-------|---------------|--------------|------|\n'
      
      // Add each student to the table
      for (const student of studentsInCategory) {
        const exercisesSubmitted = student.exercisesSubmitted.join(', ')
        const runPercent = `${student.runPercent}%`
        const correctPercent = `${student.correctPercent}%`
        const codeQuality = `${student.codeQuality}/5.0`
        const link = `[Folder](file://${student.folderPath})`
        
        report += `| ${student.name} | ${exercisesSubmitted} | ${runPercent} | ${correctPercent} | ${codeQuality} | ${link} |\n`
      }
      
      report += '\n'
    }
  }
  
  return report
}

// Calculate student category based on their performance
const calculateStudentCategory = (student) => {
  // Calculate a score from 0-100 based on correctness and code quality
  const correctnessScore = student.correctPercent
  const qualityScore = student.codeQuality * 20 // Convert 1-5 to 20-100
  
  // Weight: 70% correctness, 30% quality
  const totalScore = (correctnessScore * 0.7) + (qualityScore * 0.3)
  
  // Assign category based on score
  if (totalScore >= 90) return '5★'
  if (totalScore >= 80) return '4★'
  if (totalScore >= 70) return '3★'
  if (totalScore >= 60) return '2★'
  return '1★'
}

// Save report to file
const saveReport = (report, outputPath) => {
  fs.writeFileSync(outputPath, report)
  console.log(`Report saved to: ${outputPath}`)
}

export {
  generateReport,
  saveReport
} 