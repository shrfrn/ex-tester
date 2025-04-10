import path from 'path'

import { compactNumberList } from '../util.service.js'
import { headTemplate, footerTemplate, studentSummaryTable, exerciseDetails, navigationMenu, saveReportToFile } from './components/templates.js'

export function htmlDetailed(studentResults, options = {}) {
	// Default options
	const { saveToFile = true, isSingleExercise = false } = options

	// Pre-process student data to make it easier to work with in components
	const processedStudents = studentResults.map(student => {
		// Format exercises submitted as ranges
		const exercisesText = compactNumberList(
			Object.keys(student.testResults)
				.map(Number)
				.sort((a, b) => a - b)
		)

		return {
			...student,
			exercisesText,
		}
	})

	// Generate a detailed report for each student
	const reports = processedStudents.map(student => {
		// Start building HTML with head component
		let html = headTemplate(`${student.name} - Detailed Report`)

		// Add student name header
		html += `<h1>${student.name} Report</h1>`

		// Add student summary table
		html += studentSummaryTable(student)

		// Add details for each exercise
		const sortedExercises = Object.keys(student.testResults).sort((a, b) => Number(a) - Number(b))

		for (const exerciseId of sortedExercises) {
			const result = student.testResults[exerciseId]

			// Skip exercises that weren't submitted
			if (!result || result.submitted === false) {
				continue
			}

			// Add exercise details component
			html += exerciseDetails(exerciseId, result)
		}

		// Add footer component
		html += footerTemplate()

		return html
	})

	// For a single exercise report or if there's only one student, just return the first report
	if ((isSingleExercise || processedStudents.length === 1) && processedStudents.length > 0) {
		if (saveToFile && processedStudents.length === 1) {
			const student = processedStudents[0]
			const sanitizedName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
			const outputPath = path.join(process.cwd(), 'reports', `${sanitizedName}-detailed-report.html`)
			saveReportToFile(reports[0], outputPath)
			console.log(`Detailed HTML report for ${student.name} saved to: ${outputPath}`)
		}
		return reports[0]
	}

	// Only save files if saveToFile is true
	if (saveToFile) {
		// Save individual reports for each student
		for (let i = 0; i < processedStudents.length; i++) {
			const student = processedStudents[i]
			const sanitizedName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
			const outputPath = path.join(process.cwd(), 'reports', `${sanitizedName}-detailed-report.html`)
			saveReportToFile(reports[i], outputPath)
			console.log(`Detailed HTML report for ${student.name} saved to: ${outputPath}`)
		}
	}

	// Combine all reports into one file with navigation
	const combinedHtml = generateCombinedReport(processedStudents, reports)

	if (saveToFile) {
		const combinedOutputPath = path.join(process.cwd(), 'reports', 'all-students-detailed-report.html')
		saveReportToFile(combinedHtml, combinedOutputPath)
		console.log(`Combined detailed HTML report saved to: ${combinedOutputPath}`)
	}

	return combinedHtml
}

// Helper function to generate combined report
function generateCombinedReport(students, individualReports) {
	let html = headTemplate('All Students - Detailed Report')

	// Add page title
	html += `<h1>All Students - Detailed Report</h1>`

	// Add navigation menu
	html += navigationMenu(students)

	// Add each student's report content
	for (let i = 0; i < students.length; i++) {
		const student = students[i]
		const sanitizedId = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
		// Extract the body content from the individual report
		const reportContent = individualReports[i].split('<body>')[1].split('</body>')[0]

		html += `<div id="${sanitizedId}" class="student-report">${reportContent}</div>`
	}

	// Add footer
	html += footerTemplate()

	return html
}
