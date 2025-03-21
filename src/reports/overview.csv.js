import fs from 'fs'
import path from 'path'

import { compactNumberList } from '../utils.js'

export function csvOverview(studentResults) {
	// Create a single array with all students
	const allStudents = [...studentResults]
	
	// Sort all students by score in descending order
	allStudents.sort((a, b) => b.scores.normalizedScore - a.scores.normalizedScore)
	
	// CSV header
	let csvContent = 'Name,Exercises Submitted,Submission %,Success Rate,Score\n'
	
	// Add data for each student
	for (const student of allStudents) {
		// Format exercises submitted as ranges
		const exercises = compactNumberList(
			Object.keys(student.testResults)
				.map(Number)
				.sort((a, b) => a - b)
		)
		
		const exercisesSubmitted = `${exercises} (${Object.keys(student.testResults).length})`
		const submissionRate = Math.round(student.scores.submissionRate * 100)
		const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
		const score = student.scores.normalizedScore
		
		// Escape any commas in the student name or other fields to maintain CSV format
		const escapedName = student.name.includes(',') ? `"${student.name}"` : student.name
		const escapedExercises = exercisesSubmitted.includes(',') ? `"${exercisesSubmitted}"` : exercisesSubmitted
		const escapedSuccessRate = `"${successRate}"`  // Always quote this field as it contains parentheses
		
		// Add row to CSV
		csvContent += `${escapedName},${escapedExercises},${submissionRate}%,${escapedSuccessRate},${score}\n`
	}
	
	// Save the CSV file
	const outputPath = path.join(process.cwd(), 'student-report.csv')
	fs.writeFileSync(outputPath, csvContent)
	console.log(`CSV report saved to: ${outputPath}`)
	
	return csvContent
}

// Helper function to get category based on score is no longer used
// But kept for reference in case it's needed later
function getStudentCategory(score) {
	if (score >= 91) return '⭐⭐⭐⭐⭐ (91-100)'
	if (score >= 81) return '⭐⭐⭐⭐ (81-90)'
	if (score >= 71) return '⭐⭐⭐ (71-80)'
	if (score >= 61) return '⭐⭐ (61-70)'
	if (score >= 51) return '⭐ (51-60)'
	return 'No Stars (Below 51)'
}
