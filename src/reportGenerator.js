import { csvOverview } from './reports/overview.csv.js'
import { mdOverview } from './reports/overview.md.js'

const reports = {
    mdOverview,
    csvOverview,
}

export function generateReport(studentResults, reportName = 'csvOverview') {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults)
}
