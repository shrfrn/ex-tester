function createTestCollector() {
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

        if (condition) {
            results.score += score
            results.passed.push(description)
        } else {
            results.failed.push({ description, error: error.message })
        }
        return condition
    }

    function getResults() {
        return {
            ...results,
            percentage: Math.round((results.passed.length / results.total) * 100)
        }
    }

    return { checkAndRecord, getResults }
}

export { createTestCollector } 