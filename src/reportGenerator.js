import { mdOverview } from './reports/overview.md.js'

const reports = {
    mdOverview 
}

export function generateReport(studentResults, reportName = 'mdOverview') {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults)
}
