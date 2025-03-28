import fs from 'fs'
import path from 'path'

import { compactNumberList } from '../utils.js'

export function mdDetailed(studentResults) {
    // Generate a detailed report for each student
    const reports = studentResults.map(student => {
        // Start with student name as header
        let report = `<style>
    .indent-1 {
        margin-inline-start: 20px;
    }
</style>
# ${student.name}

Exercises Submitted | Submission % | Success Rate | Score |
|---------------------|-------------|-------------|-------|
`

        // Format exercises submitted as ranges
        const exercises = compactNumberList(
            Object.keys(student.testResults)
                .map(Number)
                .sort((a, b) => a - b)
        )

        const exercisesSubmitted = `${exercises} (${student.scores.totalExercises})`
        const submissionRate = `${Math.round(student.scores.submissionRate * 100)}%`
        const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
        const score = student.scores.normalizedScore

        report += `| ${exercisesSubmitted} | ${submissionRate} | ${successRate} | ${score} |\n\n---\n\n`

        // Add details for each exercise
        const sortedExercises = Object.keys(student.testResults)
            .sort((a, b) => Number(a) - Number(b))

        for (const exerciseId of sortedExercises) {
            const result = student.testResults[exerciseId]
            
            // Skip exercises that weren't submitted
            if (!result || result.submitted === false) {
                continue
            }

            // Get exercise title if available, otherwise use a default
            const exerciseTitle = result.title || `Exercise ${exerciseId}`
            
            // Create collapsible section for this exercise
            report += `<details>\n<summary><strong>Ex ${exerciseId} - ${exerciseTitle}</strong></summary>\n\n`
            
            // Add metrics table
            report += `| score | code quality | success | correct output |\n`
            report += `|----|---|---|---|\n`
            
            // TODO: scorePercentage incorrect - see Tom Shahar's report ex 01
            // TODO: weighted score needs to be tested
            // TODO: code quality details are not shown
            
            const scorePercentage = `${result.normalizedScore}%`
            const codeQualityScore = `${100 + result.codeQuality.score}%`
            const successCheckbox = result.success ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'
            const correctOutputCheckbox = result.correctOutput ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'
            
            report += `| ${scorePercentage} | ${codeQualityScore} | ${successCheckbox} | ${correctOutputCheckbox} |\n\n`
            
            // Add code section if available
            if (result.studentCode) {
                report += `<details class="indent-1">\n<summary><strong>Code</strong></summary>\n\n\`\`\`js\n${result.studentCode.trim()}\n\`\`\`\n</details>\n\n`
            }
            
            // Add failed tests section if available
            if (result.failed && result.failed.length > 0) {
                const totalTests = (result.passed ? result.passed.length : 0) + result.failed.length
                const failedCount = result.failed.length
                const penaltyPoints = result.failed.reduce((sum, test) => sum + (test.score || 0), 0)
                
                report += `<details class="indent-1">\n<summary><strong>${failedCount} of ${totalTests} tests failed - <code>${penaltyPoints} points</code></strong></summary>\n\n`
                report += `| test | penalty |\n| --- | --- |\n`
                
                for (const test of result.failed) {
                    report += `| ${test.description} | ${test.score} |\n`
                }
                
                report += `</details>\n`
            }
            // Fallback to the original failedTests implementation if the new format isn't available
            else if (result.failedTests && result.failedTests.length > 0) {
                const totalTests = result.totalTests || result.failedTests.length
                const failedCount = result.failedTests.length
                const penaltyPoints = result.failedTests.reduce((sum, test) => sum + (test.penalty || 0), 0)
                
                report += `<details class="indent-1">\n<summary><strong>${failedCount} of ${totalTests} tests failed - <code>${penaltyPoints} points</code></strong></summary>\n\n`
                report += `| test | penalty |\n| --- | --- |\n`
                
                for (const test of result.failedTests) {
                    report += `| ${test.name} | ${test.penalty} |\n`
                }
                
                report += `</details>\n`
            }
            
            report += `</details>\n\n---\n\n`
        }
        
        return report
    })
    
    // Save individual reports for each student
    for (let i = 0; i < studentResults.length; i++) {
        const student = studentResults[i]
        const sanitizedName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const outputPath = path.join(process.cwd(), 'detailed-reports', `${sanitizedName}-detailed-report.md`)
        fs.writeFileSync(outputPath, reports[i])
        console.log(`Detailed report for ${student.name} saved to: ${outputPath}`)
    }
    
    // Combine all reports into one file
    const combinedReport = reports.join('\n\n')
    const combinedOutputPath = path.join(process.cwd(), 'detailed-reports', 'all-students-detailed-report.md')
    fs.writeFileSync(combinedOutputPath, combinedReport)
    console.log(`Combined detailed report saved to: ${combinedOutputPath}`)
    
    return combinedReport
}
