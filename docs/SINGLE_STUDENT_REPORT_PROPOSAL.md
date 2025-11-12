# Single Student Feedback Report - Proposal

## Overview

The current report system repurposes batch testing reports for single-student feedback. This creates an awkward UX with irrelevant metrics (submission %, success rate with only 1 exercise, etc.). We need a dedicated report format optimized for individual student feedback.

---

## Current Problems with Repurposed Report

### What's Wrong

1. **Submission % = 100%** (always, since they just submitted)
2. **Success Rate with count "1 of 1"** (meaningless)
3. **"Exercises Submitted" field** shows single exercise in parentheses
4. **Generic heading** - "Student Name Report"
5. **Collapsed details by default** - requires clicking to see results
6. **Checkboxes for metrics** - designed for grading, not student feedback
7. **Code Quality shown as percentage** - confusing (e.g., "95%" means -5 penalty)
8. **No special handling for execution failure** - treats it like a regular test failure

### Current Template Structure

```
views/reports/student-detailed.pug
  → includes student-summary.pug (batch-oriented metrics)
  → includes exercise-details.pug (in collapsed <details>)
```

### Current Data Available

```javascript
{
  name: 'Student Name',
  testResults: {
    '01': {
      passed: [{ description, score }, ...],
      failed: [{ description, score }, ...],
      score: 75,
      maxScore: 100,
      percentage: 75,
      success: true/false,
      error: 'error message' | undefined,
      studentCode: '...',
      codeQuality: {
        score: -5,
        results: [{ type, message, line }, ...]
      }
    }
  },
  scores: {
    submissionRate: 1,
    normalizedScore: 75,
    ...
  }
}
```

---

## Proposed New Report Format

### Design Principles

1. **Student-centric language** - "Your submission" not "Student report"
2. **Exercise-focused** - Exercise number and title prominent
3. **Clear status messaging** - Success/failure communicated clearly
4. **Expanded by default** - No need to click to see results
5. **Actionable feedback** - What passed, what failed, what to fix
6. **Special execution failure handling** - Clear explanation when code doesn't run

### Visual Hierarchy

```
┌─────────────────────────────────────────────────┐
│ Exercise 01: Variables and Prompts              │
│ Submitted by: John Doe                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ [CASE 1: Execution Success]                     │
│                                                  │
│ ✓ Your code executed successfully!              │
│                                                  │
│ Test Results: 7/9 tests passed                  │
│ Score: 78%                                       │
│                                                  │
│ ✓ Passed Tests (7)                              │
│   • Prompt called at least twice                │
│   • fullName variable declared                  │
│   • Output contains first name                  │
│   ... etc                                       │
│                                                  │
│ ✗ Failed Tests (2)                              │
│   • fullName concatenation syntax correct       │
│     → Check your string concatenation           │
│   • Outputs differ for different inputs         │
│     → Make sure you're using variables          │
│                                                  │
│ Code Quality: 3 issues (-5 points)              │
│   ⚠ Line 3: Inconsistent indentation           │
│   ⚠ Line 7: Prefer single quotes               │
│   ⚠ Line 12: Variable name too short           │
│                                                  │
│ Your Code ▼                                      │
│   [collapsed by default, clickable]             │
│                                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Exercise 01: Variables and Prompts              │
│ Submitted by: John Doe                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ [CASE 2: Execution Failure]                     │
│                                                  │
│ ✗ Your code failed to execute                   │
│                                                  │
│ ⚠ Error Message:                                │
│   ReferenceError: fullName is not defined       │
│                                                  │
│ When your code fails to run to completion,      │
│ more detailed tests cannot be performed.        │
│ Please fix the execution error first, then      │
│ resubmit to get detailed test feedback.         │
│                                                  │
│ Your Code ▼                                      │
│   [collapsed by default, clickable]             │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Detailed Specification

### Header Section

**Content:**
```
Exercise {exerciseId}: {exerciseTitle || 'Untitled'}
Submitted by: {studentName}
```

**Styling:**
- Large, prominent heading
- Exercise number bold and colored
- Student name secondary size
- Optional: timestamp of submission

### Execution Status Section

**Case 1: Success (`result.success === true`)**

```
✓ Your code executed successfully!

Test Results: {passed.length}/{passed.length + failed.length} tests passed
Score: {percentage}%
```

**Case 2: Failure (`result.success === false`)**

```
✗ Your code failed to execute

⚠ Error Message:
  {result.error}

When your code fails to run to completion, more detailed tests 
cannot be performed. Please fix the execution error first, then 
resubmit to get detailed test feedback.

[Skip remaining sections, show code only]
```

### Passed Tests Section (success only)

```
✓ Passed Tests ({count})
  • Test description 1
  • Test description 2
  • ...
```

**Styling:**
- Green checkmark
- Simple bullet list
- Collapsed by default (optional)

### Failed Tests Section (success only)

```
✗ Failed Tests ({count})
  • Test description 1
    → Helpful hint if available
  • Test description 2
    → Helpful hint if available
  • ...
```

**Styling:**
- Red X
- Failed test descriptions prominent
- Optional hints indented
- Always expanded (critical feedback)

### Code Quality Section (if violations exist)

```
Code Quality: {violations.length} issues ({codeQuality.score} points)
  ⚠ Line {line}: {message}
  ⚠ Line {line}: {message}
  ...
```

**Styling:**
- Warning icon (⚠)
- Orange/amber color scheme
- Line numbers clickable/linkable to code section
- Shows penalty as negative points, not percentage

### Your Code Section

```
Your Code ▼
  [code with syntax highlighting]
```

**Styling:**
- Collapsed by default (unless execution failed)
- Syntax highlighted
- Line numbers shown
- If execution failed, could highlight error line

---

## Implementation Plan

### 1. Create New Template

**File:** `src/views/reports/student-feedback.pug`

```pug
extends ../layouts/main

include ../components/feedback-header
include ../components/feedback-status
include ../components/feedback-tests
include ../components/code-section

block content
  - const exerciseId = Object.keys(student.testResults)[0]
  - const result = student.testResults[exerciseId]
  
  +feedbackHeader(student.name, exerciseId, result)
  
  +feedbackStatus(result)
  
  if result.success
    +feedbackTests(result.passed, result.failed)
    
    if result.codeQuality && result.codeQuality.results.length > 0
      +feedbackCodeQuality(result.codeQuality)
  
  +codeSection(result.studentCode)
```

### 2. Create New Components

**File:** `src/views/components/feedback-header.pug`

```pug
mixin feedbackHeader(studentName, exerciseId, result)
  - const exerciseTitle = result.title || 'Untitled'
  
  .feedback-header
    h1.exercise-title
      span.exercise-number Exercise #{exerciseId}
      | : #{exerciseTitle}
    p.student-name Submitted by: #{studentName}
  
  hr
```

**File:** `src/views/components/feedback-status.pug`

```pug
mixin feedbackStatus(result)
  .feedback-status
    if result.success
      .status-success
        span.icon ✓
        h2 Your code executed successfully!
        
        - const totalTests = (result.passed?.length || 0) + (result.failed?.length || 0)
        - const passedTests = result.passed?.length || 0
        - const scorePercent = result.percentage || 0
        
        p.test-summary
          strong Test Results: 
          | #{passedTests}/#{totalTests} tests passed
        
        p.score-summary
          strong Score: 
          span.score-value #{scorePercent}%
          
    else
      .status-error
        span.icon ✗
        h2 Your code failed to execute
        
        .error-box
          p.error-label ⚠ Error Message:
          pre.error-message= result.error
        
        .execution-help
          p When your code fails to run to completion, more detailed tests cannot be performed.
          p Please fix the execution error first, then resubmit to get detailed test feedback.
  
  hr
```

**File:** `src/views/components/feedback-tests.pug`

```pug
mixin feedbackTests(passed, failed)
  .feedback-tests
    
    if passed && passed.length > 0
      details.passed-tests(open=(failed && failed.length > 0 ? false : true))
        summary
          span.icon ✓
          strong Passed Tests (#{passed.length})
        
        ul.test-list
          each test in passed
            li.test-item= test.description
    
    if failed && failed.length > 0
      .failed-tests
        .failed-header
          span.icon ✗
          strong Failed Tests (#{failed.length})
        
        ul.test-list
          each test in failed
            li.test-item
              .test-description= test.description
              if test.hint
                .test-hint → #{test.hint}
  
  hr

mixin feedbackCodeQuality(codeQuality)
  .code-quality-feedback
    .quality-header
      span.icon ⚠
      strong Code Quality: 
      | #{codeQuality.results.length} #{codeQuality.results.length === 1 ? 'issue' : 'issues'}
      span.penalty (#{codeQuality.score} points)
    
    ul.quality-issues
      each issue in codeQuality.results
        li.quality-issue
          if issue.line
            span.line-number Line #{issue.line}: 
          span.message= issue.message
  
  hr
```

### 3. Create New Report Generator

**File:** `src/services/report-generators/student-feedback.pug.js`

```javascript
import path from 'path'

let pugRender = null

export function initPugRenderer(renderer) {
	pugRender = renderer
}

export async function studentFeedbackPug(studentResults, options = {}) {
	if (!pugRender) {
		throw new Error('Pug renderer not initialized')
	}

	// Expecting single student with single exercise
	const student = studentResults[0]
	
	if (!student || !student.testResults) {
		throw new Error('Invalid student result data for feedback report')
	}

	const html = await pugRender('reports/student-feedback', {
		title: `Exercise Feedback - ${student.name}`,
		student
	})

	return html
}
```

### 4. Register New Report Type

**File:** `src/services/report.service.js`

```javascript
import { studentFeedbackPug, initPugRenderer as initFeedback } from './report-generators/student-feedback.pug.js'

const reports = {
	htmlDetailedPug,
	htmlOverview,
	mdDetailed,
	mdOverview,
	csvOverview,
	studentFeedbackPug,  // ADD THIS
}

export function initReportService(renderer) {
	initPugRenderer(renderer)
	initFeedback(renderer)  // ADD THIS
}
```

### 5. Update API Controller

**File:** `src/api/test/test.controller.js`

Change line 35 from:
```javascript
const prmHtmlReport = generateReport([studentResult], 'htmlDetailedPug', reportOptions)
```

To:
```javascript
const prmHtmlReport = generateReport([studentResult], 'studentFeedbackPug', reportOptions)
```

### 6. Add CSS Styles

**File:** `src/public/css/styles.css` (add new section)

```css
/* Student Feedback Report Styles */

.feedback-header {
  margin-bottom: 2rem;
}

.feedback-header .exercise-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.feedback-header .exercise-number {
  color: #2563eb;
  font-weight: bold;
}

.feedback-header .student-name {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
}

/* Status Section */

.feedback-status {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 8px;
}

.status-success {
  background-color: #f0fdf4;
  border: 2px solid #22c55e;
}

.status-error {
  background-color: #fef2f2;
  border: 2px solid #ef4444;
}

.feedback-status .icon {
  font-size: 2rem;
  margin-right: 0.5rem;
}

.status-success .icon {
  color: #22c55e;
}

.status-error .icon {
  color: #ef4444;
}

.feedback-status h2 {
  display: inline;
  font-size: 1.5rem;
  margin: 0;
}

.test-summary, .score-summary {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.score-value {
  color: #2563eb;
  font-size: 1.3rem;
  font-weight: bold;
}

/* Error Box */

.error-box {
  margin: 1.5rem 0;
  background-color: #fff;
  border-left: 4px solid #ef4444;
  padding: 1rem;
}

.error-label {
  font-weight: bold;
  color: #ef4444;
  margin-bottom: 0.5rem;
}

.error-message {
  background-color: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  color: #dc2626;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  margin: 0;
}

.execution-help {
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.95rem;
}

.execution-help p {
  margin: 0.5rem 0;
}

/* Test Results */

.feedback-tests {
  margin: 2rem 0;
}

.passed-tests summary {
  cursor: pointer;
  padding: 0.75rem;
  background-color: #f0fdf4;
  border-radius: 4px;
  font-size: 1.1rem;
}

.passed-tests .icon {
  color: #22c55e;
  margin-right: 0.5rem;
}

.failed-tests {
  margin-top: 1.5rem;
}

.failed-header {
  padding: 0.75rem;
  background-color: #fef2f2;
  border-radius: 4px;
  font-size: 1.1rem;
}

.failed-tests .icon {
  color: #ef4444;
  margin-right: 0.5rem;
}

.test-list {
  list-style: none;
  padding-left: 2rem;
  margin-top: 1rem;
}

.test-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.test-item:last-child {
  border-bottom: none;
}

.test-description {
  font-weight: 500;
}

.test-hint {
  color: #64748b;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 0.25rem;
}

/* Code Quality */

.code-quality-feedback {
  margin: 2rem 0;
  padding: 1rem;
  background-color: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
}

.quality-header {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.quality-header .icon {
  color: #f59e0b;
  margin-right: 0.5rem;
}

.penalty {
  color: #dc2626;
  font-weight: bold;
}

.quality-issues {
  list-style: none;
  padding-left: 1.5rem;
  margin: 0;
}

.quality-issue {
  padding: 0.25rem 0;
  font-size: 0.95rem;
}

.line-number {
  color: #2563eb;
  font-weight: 600;
}

.message {
  color: #44748b;
}
```

---

## Migration Strategy

### Phase 1: Create New Templates (No Breaking Changes)

1. Create all new template files
2. Create new report generator
3. Register new report type
4. **Don't change any existing code yet**

### Phase 2: Test in Isolation

1. Add route parameter or config flag to switch report types
2. Test new format thoroughly
3. Gather feedback

### Phase 3: Switch API Endpoint

1. Update `test.controller.js` to use new report
2. Keep old report available for batch tests
3. Monitor for issues

### Phase 4: Cleanup (Optional)

1. If old format no longer needed for API, can remove
2. Keep for batch tests indefinitely

---

## Data Requirements

### Currently Available

✅ Student name
✅ Exercise ID
✅ Test results (passed/failed arrays)
✅ Score/percentage
✅ Success status
✅ Error message
✅ Student code
✅ Code quality issues

### Missing (Optional Enhancements)

❌ Exercise title (fallback to "Untitled" works)
❌ Test hints/suggestions (would need to add to test files)
❌ Submission timestamp (could add)
❌ Previous attempt history (future enhancement)

---

## Benefits of New Format

1. **Clarity** - Purpose-built for student feedback
2. **Actionable** - Clear what passed, what failed, what to fix
3. **Professional** - Polished, modern UI
4. **Informative** - Execution errors explained clearly
5. **Maintainable** - Separate from batch reporting logic
6. **Extensible** - Easy to add hints, timestamps, etc.

---

## Example Output Comparison

### Current (Repurposed Batch Report)

```
John Doe Report

┌─────────────────────────────────────────┐
│ Exercises Submitted │ Submission %      │
│ 1 (1)              │ 100%              │
│ Success Rate        │ Score             │
│ 100% (1)           │ 78                │
└─────────────────────────────────────────┘

▶ Ex 01 - Exercise 01  [collapsed, must click]
```

### Proposed (Student Feedback Report)

```
Exercise 01: Variables and Prompts
Submitted by: John Doe

✓ Your code executed successfully!

Test Results: 7/9 tests passed
Score: 78%

✗ Failed Tests (2)
  • fullName concatenation syntax correct
  • Outputs differ for different inputs

Code Quality: 3 issues (-5 points)
  ⚠ Line 3: Inconsistent indentation
  ⚠ Line 7: Prefer single quotes
  ⚠ Line 12: Variable name too short
```

Much clearer and more actionable! 🎯

