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

export function generateReport(studentResults, reportName = 'htmlOverview') {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults)
}
