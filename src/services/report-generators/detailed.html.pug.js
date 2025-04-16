import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { compactNumberList } from '../util.service.js'

// Get the current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use the Express app instance for rendering
// We need to pass this in from the server
let pugRender = null

export function initPugRenderer(renderer) {
	pugRender = renderer
}

export async function htmlDetailedPug(studentResults, options = {}) {
	// If pugRender is not initialized, throw an error
	if (!pugRender) {
		throw new Error('Pug renderer not initialized. Call initPugRenderer first.')
	}

	// Default options
	const { saveToFile = true, isSingleExercise = false } = options

	// Pre-process student data to make it easier to work with in templates
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
	const reports = []
	for (const student of processedStudents) {
		try {
			// Render student detailed report
			const html = await pugRender('reports/student-detailed', {
				title: `${student.name} - Detailed Report`,
				student
			})
			
			reports.push(html)

			// Save individual report if needed
			if (saveToFile && !isSingleExercise) {
				const sanitizedName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
				const outputPath = path.join(process.cwd(), 'reports', `${sanitizedName}-detailed-report.html`)
				saveReportToFile(html, outputPath)
			}
		} catch (error) {
			throw error
		}
	}

	// For a single exercise report or if there's only one student, just return the first report
	if ((isSingleExercise || processedStudents.length === 1) && processedStudents.length > 0) {
		return reports[0]
	}

	// Combine all reports into one file with navigation
	const combinedHtml = await pugRender('reports/all-students-detailed', {
		title: 'All Students - Detailed Report',
		students: processedStudents
	})

	if (saveToFile) {
		const combinedOutputPath = path.join(process.cwd(), 'reports', 'all-students-detailed-report.html')
		saveReportToFile(combinedHtml, combinedOutputPath)
	}

	return combinedHtml
}

// Helper for saving files
function saveReportToFile(html, filePath) {
	const reportsDir = path.dirname(filePath)
	if (!fs.existsSync(reportsDir)) {
		fs.mkdirSync(reportsDir, { recursive: true })
	}
	fs.writeFileSync(filePath, html)
}
