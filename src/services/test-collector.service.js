export function createTestCollector() {
	const results = {
		passed: [],
		failed: [],
		score: 0,
		count: 0,
		maxScore: 0,
	}

	function checkAndRecord(description, condition, score = 10) {
		results.count++
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

	function getResults() {
		return {
			...results,
			percentage: Math.round((results.score / results.maxScore) * 100),
		}
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
			passed: [],
			failed: [],
			score: 0,
			maxScore: 0,
			percentage: 0,
		}
	}

	return { checkAndRecord, getResults, executionFailed }
}


