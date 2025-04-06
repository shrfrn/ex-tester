import fs from 'fs'
import path from 'path'

import { compactNumberList } from '../utils.js'

export function mdOverview(studentResults) {
	const categories = {
		'⭐⭐⭐⭐⭐': [],
		'⭐⭐⭐⭐': [],
		'⭐⭐⭐': [],
		'⭐⭐': [],
		'⭐': [],
		'No Stars': [],
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
			report += `## ${category} (${_getCategoryScoreRange(category)})\n\n`

			// Create table header
			report += '| Name | Exercises Submitted | Submission % | Success Rate | Score |\n'
			report += '|------|---------------------|-------------|-------------|-------|\n'

			// Sort students by score in descending order
			const sortedStudents = [...studentsInCategory].sort((a, b) => b.scores.normalizedScore - a.scores.normalizedScore)

			// Add each student to the table
			for (const student of sortedStudents) {
				// Format exercises submitted as ranges
				const exercises = compactNumberList(
					Object.keys(student.testResults)
						.map(Number)
						.sort((a, b) => a - b)
				)

				const exercisesSubmitted = `${exercises} (${Object.keys(student.testResults).length})`
				const submissionRate = `${Math.round(student.scores.submissionRate * 100)}%`
				const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
				const score = student.scores.normalizedScore

				report += `| ${student.name} | ${exercisesSubmitted} | ${submissionRate} | ${successRate} | ${score} |\n`
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

// Helper function to get score range for a category
function _getCategoryScoreRange(category) {
	switch (category) {
		case '⭐⭐⭐⭐⭐':
			return '91-100'
		case '⭐⭐⭐⭐':
			return '81-90'
		case '⭐⭐⭐':
			return '71-80'
		case '⭐⭐':
			return '61-70'
		case '⭐':
			return '51-60'
		case 'No Stars':
			return 'Below 51'
		default:
			return ''
	}
}
