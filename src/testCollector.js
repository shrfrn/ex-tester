function createTestCollector() {
    const results = {
        passed: [],
        failed: [],
        score: 0,
        count: 0
    }

    function checkAndRecord(description, testFn, score = 10) {
        results.count++
        try {
            testFn()
            results.passed.push(description)
            results.score += score
            return true
        } catch (error) {
            results.failed.push({ description, error: error.message })
            return false
        }
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