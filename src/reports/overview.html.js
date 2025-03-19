import fs from 'fs'
import path from 'path'

import { compactNumberList } from '../utils.js'

export function htmlOverview(studentResults) {
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

	// Start building the HTML report
	let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Assignment Evaluation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-top: 30px;
      color: #444;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
  </style>
</head>
<body>
  <h1>Student Assignment Evaluation Report</h1>
`

	// Generate report sections for each category
	for (const [category, studentsInCategory] of Object.entries(categories)) {
		if (studentsInCategory.length > 0) {
			html += `
  <h2>${category} (${_getCategoryScoreRange(category)})</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Exercises Submitted</th>
        <th>Submission %</th>
        <th>Success Rate</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
`
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

				const exercisesSubmitted = `${exercises} (${student.scores.totalExercises})`
				const submissionRate = `${Math.round(student.scores.submissionRate * 100)}%`
				const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
				const score = student.scores.normalizedScore

				html += `
      <tr>
        <td>${student.name}</td>
        <td>${exercisesSubmitted}</td>
        <td>${submissionRate}</td>
        <td>${successRate}</td>
        <td>${score}</td>
      </tr>`
			}

			html += `
    </tbody>
  </table>`
		}
	}

	html += `
</body>
</html>`

	// Save the report
	const outputPath = path.join(process.cwd(), 'student-report.html')
	fs.writeFileSync(outputPath, html)
	console.log(`Report saved to: ${outputPath}`)

	return html
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
