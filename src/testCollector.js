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
            percentage: Math.round((results.score / results.maxScore) * 100)
        }
    }

    return { checkAndRecord, getResults }
}

export { createTestCollector } 