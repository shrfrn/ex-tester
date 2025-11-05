import fs from 'fs'
import path from 'path'

// Common HTML head template with styling and scripts
export function headTemplate(title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/javascript.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block)
      })
    })
  </script>
  ${styleComponent()}
</head>
<body>`
}

// Component for page footer
export function footerTemplate() {
  return `
</body>
</html>`
}

// Component for CSS styling
function styleComponent() {
  return `
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
  </style>`
}

// Component for student summary table
export function studentSummaryTable(student) {
  const exercisesSubmitted = `${student.exercisesText} (${student.scores.totalExercises})`
  const submissionRate = `${Math.round(student.scores.submissionRate * 100)}%`
  const successRate = `${Math.round(student.scores.successRate * 100)}% (${student.scores.successfulCount})`
  const score = student.scores.normalizedScore

  return `
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
        <td>${exercisesSubmitted}</td>
        <td>${submissionRate}</td>
        <td>${successRate}</td>
        <td>${score}</td>
      </tr>
    </tbody>
  </table>

  <hr>`
}

// Component for exercise details
export function exerciseDetails(exerciseId, result) {
  const exerciseTitle = result.title || `Exercise ${exerciseId}`
  const scorePercentage = result.normalizedScore ? 
      `${result.normalizedScore}%` : 
      (result.percentage ? `${result.percentage}%` : 'N/A')
  
  const codeQualityScore = `${100 + result.codeQuality.score}%`
  const successCheckbox = result.success ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'
  const correctOutputCheckbox = result.correctOutput ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>'

  return `
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
          <td>${scorePercentage}</td>
          <td>${codeQualityScore}</td>
          <td>${successCheckbox}</td>
          <td>${correctOutputCheckbox}</td>
        </tr>
      </tbody>
    </table>
    ${result.studentCode ? codeSection(result.studentCode) : ''}
    ${result.failed && result.failed.length > 0 ? 
      failedTestsSection(result.failed, result.passed ? result.passed.length : 0) : ''}
  </details>

  <hr>`
}

// Component for code section
function codeSection(code) {
  return `
    <details class="indent-1">
      <summary><strong>Code</strong></summary>
      <div class="code-container">
        <pre><code class="language-javascript">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
    </details>`
}

// Component for failed tests section
function failedTestsSection(failed, passedCount) {
  const totalTests = passedCount + failed.length
  const failedCount = failed.length
  const penaltyPoints = failed.reduce((sum, test) => sum + (test.score || 0), 0)

  let html = `
    <details class="indent-1">
      <summary><strong>${failedCount} of ${totalTests} tests failed - <code>${penaltyPoints} points</code></strong></summary>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Penalty</th>
          </tr>
        </thead>
        <tbody>`

  for (const test of failed) {
    html += `
          <tr>
            <td>${test.description}</td>
            <td>${test.score}</td>
          </tr>`
  }

  html += `
        </tbody>
      </table>
    </details>`

  return html
}

// Component for navigation menu
export function navigationMenu(students) {
  let html = `
  <nav>
    <ul>`

  for (const student of students) {
    const sanitizedId = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    html += `
      <li><a href="#${sanitizedId}">${student.name}</a></li>`
  }

  html += `
    </ul>
  </nav>`

  return html
}

// Helper for saving files
export function saveReportToFile(html, filePath) {
  const reportsDir = path.dirname(filePath)
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  fs.writeFileSync(filePath, html)
} 