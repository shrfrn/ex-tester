function createTestCollector() {
    const results = {
        passed: [],
        failed: [],
        total: 0
    }

    function checkAndRecord(description, testFn) {
        results.total++
        try {
            testFn()
            results.passed.push(description)
            return true
        } catch (error) {
            results.failed.push({ description, error: error.message })
            return false
        }
    }

    function getScore() {
        return {
            passed: results.passed.length,
            failed: results.failed.length,
            total: results.total,
            percentage: Math.round((results.passed.length / results.total) * 100)
        }
    }

    function printResults() {
        console.log('\nTest Results:')
        console.log('-------------')
        console.log(`Passed: ${results.passed.length}/${results.total} (${getScore().percentage}%)`)
        
        if (results.failed.length > 0) {
            console.log('\nFailed Tests:')
            results.failed.forEach(({ description, error }) => {
                console.log(`❌ ${description}`)
                console.log(`   ${error}`)
            })
        }
    }

    return { checkAndRecord, getScore, printResults }
}

export { createTestCollector } 