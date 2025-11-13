export function createTestCollector() {
	const results = {
		submitted: true,
		passed: [],
		failed: [],
		score: 0,
		maxScore: 0,
	}

	function checkAndRecord(description, condition, score = 10) {
		results.maxScore += score

		if (typeof condition === 'function') condition = condition()

		if (condition) {
			results.score += score
			results.passed.push({ description, score })
		} else {
			results.failed.push({ description, score })
		}

		return condition
	}

	function getResults(success, studentCode) {
		return { ...results, success, studentCode }
	}

	function executionFailed(result, studentCode) {
		return {
			submitted: true,
			success: false,
			error: result.error,
			errorType: result.errorType,
			line: result.line,
			column: result.column,
			stack: result.stack,
			studentCode,
			normalizedScore: 0,
		}
	}

	return { checkAndRecord, getResults, executionFailed }
}


