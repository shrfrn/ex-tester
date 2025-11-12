import { htmlDetailed } from './report-generators/detailed.html.js'
import { htmlDetailedPug, initPugRenderer } from './report-generators/detailed.html.pug.js'
import { mdDetailed } from './report-generators/detailed.md.js'
import { csvOverview } from './report-generators/overview.csv.js'
import { htmlOverview } from './report-generators/overview.html.js'
import { mdOverview } from './report-generators/overview.md.js'
import { studentFeedbackPug, initPugRenderer as initFeedbackRenderer } from './report-generators/student-feedback.pug.js'

const reports = {
    mdOverview,
    csvOverview,
    mdDetailed,
    htmlOverview,
    htmlDetailed,
    htmlDetailedPug,
    studentFeedbackPug,
}

// Initialize the Pug renderer with the Express app
export function initReportService(renderer) {
    initPugRenderer(renderer)
    initFeedbackRenderer(renderer)
}

export function generateReport(studentResults, reportName = 'htmlDetailedPug', options = {}) {
    const report = reports[reportName]
    if (!report) {
        throw new Error(`Report ${reportName} not found`)
    }
    return report(studentResults, options)
}