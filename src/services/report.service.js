import { htmlDetailed } from './report-generators/detailed.html.js'
import { mdDetailed } from './report-generators/detailed.md.js'
import { csvOverview } from './report-generators/overview.csv.js'
import { htmlOverview } from './report-generators/overview.html.js'
import { mdOverview } from './report-generators/overview.md.js'

const reports = {
    mdOverview,
    csvOverview,
    mdDetailed,
    htmlOverview,
    htmlDetailed,
}

export function generateReport(studentResults, reportName = 'htmlDetailed', options = {}) {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults, options)
}