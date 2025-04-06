import fs from 'fs'
import path from 'path'

import { compactNumberList } from '../utils.js'

export function htmlDetailed(studentResults, options = {}) {
    // Default options
    const { saveToFile = true, isSingleExercise = false } = options;
    // Generate a detailed report for each student
    const reports = studentResults.map(student => {
        // Start building HTML
        let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${student.name} - Detailed Report</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/javascript.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block)
      })
    })
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-top: 30px;
      color: #444;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    details {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
      background-color: #f9f9f9;
    }
    summary {
      cursor: pointer;
      font-weight: bold;
      padding: 8px 0;
    }
    summary:hover {
      color: #0066cc;
    }
    .indent-1 {
      margin-left: 20px;
    }
    hr {
      border: 0;
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    pre {
      margin: 0;
      padding: 0;
      border-radius: 4px;
      overflow-x: auto;
    }
    pre code {
      padding: 15px !important;
      border-radius: 4px;
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .code-container {
      margin-top: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>${student.name}</h1>

  <table>
    <thead>
      <tr>
        <th>Exercises Submitted</th>
        <th>Submission %</th>
        <th>Success Rate</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      <tr>
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

        html += `
        <td>${exercisesSubmitted}</td>
        <td>${submissionRate}</td>
        <td>${successRate}</td>
        <td>${score}</td>
      </tr>
    </tbody>
  </table>

  <hr>
`

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
            html += `
  <details>
    <summary><strong>Ex ${exerciseId} - ${exerciseTitle}</strong></summary>

    <table>
      <thead>
        <tr>
          <th>Score</th>
          <th>Code Quality</th>
          <th>Success</th>
          <th>Correct Output</th>
        </tr>
      </thead>
      <tbody>
        <tr>
`
            // TODO: scorePercentage incorrect - see Tom Shahar's report ex 01
            // TODO: weighted score needs to be tested
            // TODO: code quality details are not shown

            const scorePercentage = result.score ? `${result.score}%` : 'N/A'
            const codeQualityScore = `${100 + result.codeQuality.score}%`
            const successCheckbox = result.success ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'
            const correctOutputCheckbox = result.correctOutput ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'

            html += `
          <td>${scorePercentage}</td>
          <td>${codeQualityScore}</td>
          <td>${successCheckbox}</td>
          <td>${correctOutputCheckbox}</td>
        </tr>
      </tbody>
    </table>
`

            // Add code section if available
            if (result.studentCode) {
                html += `
    <details class="indent-1">
      <summary><strong>Code</strong></summary>
      <div class="code-container">
        <pre><code class="language-javascript">${result.studentCode.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
    </details>
`
            }

            // Add failed tests section if available
            if (result.failed && result.failed.length > 0) {
                const totalTests = (result.passed ? result.passed.length : 0) + result.failed.length
                const failedCount = result.failed.length
                const penaltyPoints = result.failed.reduce((sum, test) => sum + (test.score || 0), 0)

                html += `
    <details class="indent-1">
      <summary><strong>${failedCount} of ${totalTests} tests failed - <code>${penaltyPoints} points</code></strong></summary>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Penalty</th>
          </tr>
        </thead>
        <tbody>
`

                for (const test of result.failed) {
                    html += `
          <tr>
            <td>${test.description}</td>
            <td>${test.score}</td>
          </tr>
`
                }

                html += `
        </tbody>
      </table>
    </details>
`
            }
            // Fallback to the original failedTests implementation if the new format isn't available
            else if (result.failedTests && result.failedTests.length > 0) {
                const totalTests = result.totalTests || result.failedTests.length
                const failedCount = result.failedTests.length
                const penaltyPoints = result.failedTests.reduce((sum, test) => sum + (test.penalty || 0), 0)

                html += `
    <details class="indent-1">
      <summary><strong>${failedCount} of ${totalTests} tests failed - <code>${penaltyPoints} points</code></strong></summary>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Penalty</th>
          </tr>
        </thead>
        <tbody>
`

                for (const test of result.failedTests) {
                    html += `
          <tr>
            <td>${test.name}</td>
            <td>${test.penalty}</td>
          </tr>
`
                }

                html += `
        </tbody>
      </table>
    </details>
`
            }

            html += `
  </details>

  <hr>
`
        }

        html += `
</body>
</html>
`

        return html
    })

    // For a single exercise report, just return the first report
    if (isSingleExercise && studentResults.length === 1) {
        return reports[0];
    }

    // Only save files if saveToFile is true
    if (saveToFile) {
        // Create directory if it doesn't exist
        const detailedReportsDir = path.join(process.cwd(), 'detailed-reports')
        if (!fs.existsSync(detailedReportsDir)) {
            fs.mkdirSync(detailedReportsDir, { recursive: true })
        }

        // Save individual reports for each student
        for (let i = 0; i < studentResults.length; i++) {
            const student = studentResults[i]
            const sanitizedName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(process.cwd(), 'detailed-reports', `${sanitizedName}-detailed-report.html`)
            fs.writeFileSync(outputPath, reports[i])
            console.log(`Detailed HTML report for ${student.name} saved to: ${outputPath}`)
        }
    }

    // Combine all reports into one file with navigation
    const combinedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Students - Detailed Report</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/javascript.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block)
      })
    })
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    nav {
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    nav ul {
      list-style-type: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    nav li {
      margin: 5px 0;
    }
    nav a {
      text-decoration: none;
      color: #0066cc;
      padding: 5px 10px;
      border-radius: 3px;
    }
    nav a:hover {
      background-color: #e0e0e0;
    }
    .student-report {
      margin-bottom: 50px;
      border-bottom: 3px solid #ddd;
      padding-bottom: 30px;
    }
    /* Re-include all previous styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    details {
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
      background-color: #f9f9f9;
    }
    summary {
      cursor: pointer;
      font-weight: bold;
      padding: 8px 0;
    }
    summary:hover {
      color: #0066cc;
    }
    .indent-1 {
      margin-left: 20px;
    }
    hr {
      border: 0;
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    pre {
      margin: 0;
      padding: 0;
      border-radius: 4px;
      overflow-x: auto;
    }
    pre code {
      padding: 15px !important;
      border-radius: 4px;
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .code-container {
      margin-top: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>All Students - Detailed Report</h1>

  <nav>
    <ul>
      ${studentResults.map(student => {
        const sanitizedId = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        return `<li><a href="#${sanitizedId}">${student.name}</a></li>`
      }).join('\n      ')}
    </ul>
  </nav>

  ${studentResults.map((student, index) => {
    const sanitizedId = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    return `<div id="${sanitizedId}" class="student-report">${reports[index].split('<body>')[1].split('</body>')[0]}</div>`
  }).join('\n  ')}
</body>
</html>
`

    if (saveToFile) {
        const combinedOutputPath = path.join(process.cwd(), 'detailed-reports', 'all-students-detailed-report.html')
        fs.writeFileSync(combinedOutputPath, combinedHtml)
        console.log(`Combined detailed HTML report saved to: ${combinedOutputPath}`)
    }

    return combinedHtml
}