let pugRender = null

export function initPugRenderer(renderer) {
	pugRender = renderer
}

export async function studentFeedbackPug(studentResults, options = {}) {
	if (!pugRender) {
		throw new Error('Pug renderer not initialized. Call initPugRenderer first.')
	}

	const student = studentResults[0]
	
	if (!student || !student.testResults) {
		throw new Error('Invalid student result data for feedback report')
	}

	const exerciseId = Object.keys(student.testResults)[0]
	
	const html = await pugRender('reports/student-feedback', {
		title: `Exercise ${exerciseId} - Feedback`,
		student
	})

	return html
}

