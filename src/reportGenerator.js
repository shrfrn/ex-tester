import { htmlDetailed } from './reports/detailed.html.js'
import { mdDetailed } from './reports/detailed.md.js'
import { csvOverview } from './reports/overview.csv.js'
import { htmlOverview } from './reports/overview.html.js'
import { mdOverview } from './reports/overview.md.js'

const reports = {
    mdOverview,
    csvOverview,
    mdDetailed,
    htmlOverview,
    htmlDetailed,
}

/**
 * Generate a report for student test results
 * @param {Array} studentResults - Array of student test results
 * @param {string} reportName - Name of the report to generate
 * @param {Object} options - Options for the report generator
 * @returns {string} Generated report
 */
export function generateReport(studentResults, reportName = 'htmlDetailed', options = {}) {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults, options)
}
