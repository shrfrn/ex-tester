# Ex-Tester System Overview

## Table of Contents
1. [High-Level Flow](#high-level-flow)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Detailed Component Breakdown](#detailed-component-breakdown)
5. [Testing Flow](#testing-flow)
6. [Mocking System](#mocking-system)
7. [Grading System](#grading-system)
8. [Report Generation](#report-generation)

---

## High-Level Flow

### Start to Finish Process

```
User Input → File Discovery → Test Execution → Code Quality Check → Score Calculation → Report Generation
```

**Step-by-step:**

1. **Entry Point** (`src/index.js`)
   - User provides config or CLI args
   - Specifies: submission path, exercise numbers, report type

2. **File Discovery** (`file-utils.service.js`)
   - Finds student folders using glob patterns
   - Locates exercise files (e.g., `01.js`, `02.js`)

3. **Test Execution** (`test-runner.js` + individual test files)
   - For each student, for each exercise:
     - Load student code
     - Run corresponding test file
     - Execute code in sandboxed VM
     - Collect test results

4. **Code Quality Analysis** (`codeQuality.test.js`)
   - Validates naming conventions
   - Checks indentation
   - Verifies line spacing
   - Enforces quote style
   - Ensures no semicolons

5. **Score Calculation** (`test-runner.js`)
   - Calculate raw score from tests
   - Apply code quality modifiers
   - Normalize to 0-100 scale
   - Weight exercises appropriately

6. **Report Generation** (`report.service.js`)
   - Generate HTML/Markdown/CSV reports
   - Display results per student
   - Show detailed test breakdowns

---

## Architecture Overview

### Directory Structure

```
ex-tester/
├── src/
│   ├── index.js                    # CLI entry point
│   ├── server.js                   # Web server for single exercise testing
│   ├── test-runner.js              # Orchestrates test execution
│   ├── prompt.js                   # Interactive CLI prompts
│   └── services/
│       ├── test.service.js         # VM sandbox & test utilities
│       ├── mock-browser.service.js # Browser API mocks
│       ├── file-utils.service.js   # File discovery & parsing
│       ├── report.service.js       # Report generation orchestrator
│       └── util.service.js         # Utility functions
├── tests/
│   ├── 01.test.js ... 59.test.js  # Individual exercise tests
│   ├── codeQuality.test.js        # Code quality validators
│   └── codeAnalyzer.js            # Advanced code analysis
└── reports/                        # Generated reports output
```

### Two Modes of Operation

1. **Batch Mode** (CLI)
   - Tests multiple students
   - Multiple exercises
   - Generates comprehensive reports
   - Entry: `npm start` or `npm run start:config`

2. **Single Exercise Mode** (Web Server)
   - Upload single file
   - Test one exercise
   - Instant feedback
   - Entry: `npm run server` → http://localhost:3000

---

## Core Components

### 1. Test Runner (`test-runner.js`)

**Purpose:** Orchestrates the entire testing process

**Key Functions:**
- `runExerciseTests()` - Main entry point for running tests
- `runTests()` - Executes a single exercise test
- `calculateStudentScores()` - Computes final grades

**Flow:**
```javascript
runExerciseTests({ studentFolder, exerciseFiles })
  → For each exercise file:
    → runTests(exerciseId, studentScript)
      → Import test file (e.g., tests/01.test.js)
      → Execute test(studentScript)
      → Add code quality analysis
      → Return results
```

### 2. Test Service (`test.service.js`)

**Purpose:** Provides VM sandbox and test utilities

**Key Functions:**
- `runScript(code, inputs)` - Execute student code in sandbox
- `runFunction(functionName, inputs)` - Execute specific function
- `createTestCollector()` - Create test result collector
- `hasFunctionWithSignature()` - Verify function exists with correct params

**Sandbox Features:**
- Isolated VM context
- Mocked browser APIs
- Variable tracking
- Timeout protection
- Security restrictions (no require, import, fetch, etc.)

### 3. Mock Browser Service (`mock-browser.service.js`)

**Purpose:** Mock browser APIs for testing student code

**Mocked APIs:**
- `prompt()`, `confirm()`, `alert()`
- `console.log()`, `console.table()`, `console.warn()`, etc.
- `setInterval()`, `clearInterval()`
- `setTimeout()`, `clearTimeout()`

**Features:**
- Pre-set responses for prompts/confirms
- Capture all output messages
- Track function call counts
- Fast-forward timers (no real delays)

### 4. Code Quality Validator (`codeQuality.test.js`)

**Purpose:** Enforce coding standards

**Validators:**
- `validateVarNames()` - camelCase or UPPER_SNAKE_CASE
- `validateIndentation()` - Consistent tabs/spaces
- `validateLineSpacing()` - Max 4 consecutive lines
- `validateQuotes()` - Single quotes preferred
- `validateNoSemicolons()` - No trailing semicolons

**Scoring:** Each violation deducts points (-2 to -5)

---

## Detailed Component Breakdown

### Test Execution Pipeline

#### Phase 1: Initialization

```javascript
// test-runner.js
export async function runTests(exerciseId, studentScript) {
    const testScriptPath = `../tests/${exerciseId}.test.js`
    const { test } = await import(testScriptPath)
    // ...
}
```

**What happens:**
1. Dynamically imports the test file for the exercise
2. Test file exports a `test(studentFilePath)` function

#### Phase 2: Code Preparation

```javascript
// Inside test file (e.g., 01.test.js)
export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }
    // ...
}
```

**What happens:**
1. Read student file
2. Strip comments (preserves strings)
3. Return early if file empty

#### Phase 3: Test Execution

```javascript
// Create test collector
let { checkAndRecord, getResults } = createTestCollector()

// Run student code
const result = runScript(studentCode, ['John', 'Smith'])

// Record test results
checkAndRecord('Code executes successfully', result.success, 20)
checkAndRecord('Prompt called twice', result.callCounts.prompt >= 2, 10)
```

**What happens:**
1. Create test collector (tracks pass/fail)
2. Execute student code in sandbox with test inputs
3. Check various conditions
4. Record each test with description and score

#### Phase 4: Result Collection

```javascript
return { 
    ...getResults(), 
    success: result.success, 
    weight: 1, 
    studentCode 
}
```

**Returns:**
```javascript
{
    passed: [...],        // Array of passed tests
    failed: [...],        // Array of failed tests
    score: 80,           // Raw score
    maxScore: 100,       // Maximum possible
    percentage: 80,      // Score percentage
    success: true,       // Code executed without errors
    weight: 1,           // Exercise weight
    studentCode: '...'   // Original code
}
```

---

## Testing Flow

### VM Sandbox Execution

**The Sandbox (`test.service.js`):**

```javascript
function _initSandbox() {
    resetMocks()
    
    const sandbox = {
        // Mocked browser APIs
        console: { log: mockConsoleLog, ... },
        alert: mockAlert,
        prompt: mockPrompt,
        confirm: mockConfirm,
        
        // Safe globals
        Math, String, Number, Array, Object, Date,
        parseInt, parseFloat, isNaN,
        
        // Variable tracking
        declaredVariables: new Set(),
        accessedVariables: new Set(),
        
        // Security: blocked APIs
        require: undefined,
        import: undefined,
        Promise: undefined,
        fetch: undefined,
    }
    
    // Proxy to track variable usage
    return new Proxy(sandbox, handler)
}
```

**Execution:**

```javascript
function _runInContext(code, inputs = [], timeout = 500) {
    const sandbox = _initSandbox()
    const script = new vm.Script(code)
    const context = vm.createContext(sandbox)
    
    // Pre-set mock responses
    setPromptResponses(inputs.filter(i => typeof i !== 'boolean'))
    setConfirmResponses(inputs.filter(i => typeof i === 'boolean'))
    
    // Execute with timeout
    script.runInContext(context, { timeout })
}
```

**Key Features:**
1. **Isolation:** Student code can't access file system, network, etc.
2. **Timeout:** Prevents infinite loops (500ms default)
3. **Variable Tracking:** Knows what variables were declared/accessed
4. **Mock Responses:** Pre-programmed inputs for interactive code

---

## Mocking System

### How Mocks Work

**1. Mock Functions Capture Behavior:**

```javascript
// mock-browser.service.js
const promptResponses = []
const consoleMessages = []
const callCounts = { prompt: 0, consoleLog: 0, ... }

const mockPrompt = (message, defaultValue = '') => {
    callCounts.prompt++
    const response = promptResponses.shift() || defaultValue
    consoleMessages.push(`PROMPT: ${message}`)
    return response
}
```

**2. Tests Pre-Set Responses:**

```javascript
// In test file
const result = runScript(studentCode, ['John', 'Smith'])
// Internally: setPromptResponses(['John', 'Smith'])
```

**3. Tests Verify Behavior:**

```javascript
// Check if prompt was called
checkAndRecord('Prompt called twice', result.callCounts.prompt >= 2, 10)

// Check output
checkAndRecord('Output contains name', 
    result.consoleOutput.some(output => output.includes('John')), 10)
```

### Timer Mocking

**Fast-Forward Approach:**

```javascript
const mockSetInterval = (callback, delay) => {
    callCounts.setInterval++
    const id = nextIntervalId++
    
    const runCallback = () => {
        if (intervals[id]?.isActive) {
            callback()
            setImmediate(runCallback)  // No real delay!
        }
    }
    
    setImmediate(runCallback)
    return id
}
```

**Why:** Tests run instantly without waiting for real timers

---

## Grading System

### Score Calculation Flow

#### 1. Raw Test Scores

Each test has a point value:

```javascript
checkAndRecord('Code executes successfully', result.success, 20)  // 20 points
checkAndRecord('Prompt called twice', result.callCounts.prompt >= 2, 10)  // 10 points
```

**Result:**
```javascript
{
    score: 80,        // Points earned
    maxScore: 100,    // Total possible
    percentage: 80    // Raw percentage
}
```

#### 2. Code Quality Modifier

```javascript
// test-runner.js
const codeQuality = validateCodeQuality(studentScript)
results.codeQuality = codeQuality

// codeQuality.score ranges from -11 to 0
// Examples:
// - Perfect code: 0
// - Bad naming: -5
// - Bad indentation: -5
// - Missing line spacing: -2
```

#### 3. Normalized Score Calculation

```javascript
// calculateStudentScores() in test-runner.js

for (const exercise of submittedExercises) {
    const result = student.testResults[exercise]
    
    // Step 1: Normalize raw score to 0-100%
    let normalizedScore = Math.min(100, 
        Math.round((result.score / result.maxScore) * 100))
    
    // Step 2: Apply code quality factor
    const codeQualityFactor = (100 + result.codeQuality.score) / 100
    // Examples:
    // - Perfect code (0): factor = 1.00 (no change)
    // - -5 penalty: factor = 0.95 (5% reduction)
    // - -11 penalty: factor = 0.89 (11% reduction)
    
    normalizedScore = Math.min(100, 
        Math.round(normalizedScore * codeQualityFactor))
    
    // Step 3: Weight by exercise importance
    totalWeightedScore += normalizedScore * result.weight
    totalWeight += result.weight
}

// Final score
const finalScore = Math.round(totalWeightedScore / totalWeight)
```

#### 4. Student Summary Metrics

```javascript
student.scores = {
    submissionRate: 0.85,        // 85% of exercises submitted
    normalizedScore: 87,         // Final weighted score
    submittedCount: 17,          // Number submitted
    totalExercises: 20,          // Total assigned
    successfulCount: 15,         // Number that executed without errors
    successRate: 0.75            // 75% success rate
}
```

### Grading Example

**Scenario:** Student submits exercise with:
- Raw test score: 85/100 (85%)
- Code quality issues: -5 (bad variable names)

**Calculation:**
```
1. Normalized score: 85%
2. Code quality factor: (100 + (-5)) / 100 = 0.95
3. Final score: 85 * 0.95 = 80.75 → 81%
```

---

## Report Generation

### Report Types

1. **HTML Detailed** (`htmlDetailedPug`)
   - Full test breakdown per student
   - Shows passed/failed tests
   - Displays student code
   - Code quality violations
   - Generated using Pug templates

2. **HTML Overview** (`htmlOverview`)
   - Summary table of all students
   - Score comparisons
   - Quick statistics

3. **Markdown Detailed** (`mdDetailed`)
   - Text-based detailed report
   - Good for version control

4. **Markdown Overview** (`mdOverview`)
   - Text-based summary

5. **CSV Overview** (`csvOverview`)
   - Spreadsheet-compatible
   - Easy data analysis

### Report Generation Flow

```javascript
// report.service.js
export function generateReport(studentResults, reportName = 'htmlDetailedPug') {
    const report = reports[reportName]
    return report(studentResults, options)
}
```

**For HTML reports:**

```javascript
// detailed.html.pug.js
export async function htmlDetailedPug(studentResults, options = {}) {
    // Render using Pug template
    const html = await pugRenderer('reports/all-students-detailed', {
        students: studentResults,
        title: 'Student Test Results'
    })
    
    // Save to file
    if (options.saveToFile !== false) {
        fs.writeFileSync('reports/all-students-detailed-report.html', html)
    }
    
    return html
}
```

**Pug Template Structure:**

```
views/
├── reports/
│   ├── all-students-detailed.pug    # Main report template
│   └── student-detailed.pug         # Single student template
└── components/
    ├── student-summary.pug          # Score summary
    ├── exercise-details.pug         # Test results
    ├── failed-tests.pug             # Failed test list
    ├── code-section.pug             # Student code display
    └── style.pug                    # CSS styles
```

---

## Key Patterns & Concepts

### 1. Test Collector Pattern

**Purpose:** Accumulate test results with consistent scoring

```javascript
const { checkAndRecord, getResults } = createTestCollector()

// Add tests
checkAndRecord('Description', condition, points)
checkAndRecord('Description', () => complexCheck(), points)

// Get final results
const results = getResults()
// { passed: [...], failed: [...], score: X, maxScore: Y, percentage: Z }
```

### 2. Sandbox Pattern

**Purpose:** Execute untrusted code safely

**Key aspects:**
- VM isolation
- Timeout protection
- API mocking
- Variable tracking
- Security restrictions

### 3. Mock & Capture Pattern

**Purpose:** Test interactive code without user input

**Flow:**
1. Pre-set responses: `setPromptResponses(['value1', 'value2'])`
2. Execute code: Student code calls `prompt()`
3. Mock returns pre-set value
4. Capture behavior: Track calls, messages, outputs
5. Verify: Check captured data matches expectations

### 4. Dynamic Test Loading

**Purpose:** Flexible test suite

```javascript
const testScriptPath = `../tests/${exerciseId}.test.js`
const { test } = await import(testScriptPath)
```

**Benefits:**
- Add new tests without changing runner
- Each test is independent
- Easy to maintain

---

## Common Testing Patterns

### Pattern 1: Basic Execution Test

```javascript
const result = runScript(studentCode, inputs)
checkAndRecord('Code executes successfully', result.success, 20)
```

### Pattern 2: Function Call Verification

```javascript
checkAndRecord('Prompt called twice', result.callCounts.prompt >= 2, 10)
checkAndRecord('Alert used for output', result.callCounts.alert > 0, 10)
```

### Pattern 3: Output Verification

```javascript
checkAndRecord('Output contains expected text', 
    result.allOutput.some(output => output.includes('Hello')), 10)
```

### Pattern 4: Code Structure Verification

```javascript
checkAndRecord('Uses if/else structure', () => {
    return /if\s*\(/.test(studentCode) && /else/.test(studentCode)
}, 10)
```

### Pattern 5: Variable Declaration Check

```javascript
checkAndRecord('fullName variable declared', 
    result.variables.declared.includes('fullName'), 10)
```

### Pattern 6: Multiple Test Cases

```javascript
const testCases = [
    ['input1', 'expected1'],
    ['input2', 'expected2'],
]

checkAndRecord('Works for all inputs', () => {
    return testCases.every(([input, expected]) => {
        const result = runScript(studentCode, [input])
        return result.allOutput.some(o => o.includes(expected))
    })
}, 20)
```

### Pattern 7: Function Testing

```javascript
// First run to load functions
runScript(studentCode, [])

// Then test specific function
const result = runFunction('calculateSum', [5, 10])
checkAndRecord('Returns correct value', result.returnValue === 15, 10)
checkAndRecord('Returns number type', 
    checkReturnValueType(result.returnValue, 'number'), 10)
```

---

## Quick Reference

### Running Tests

**Batch mode:**
```bash
npm start                           # Interactive prompts
npm run start:config                # Use config file
node src/index.js --config config.json
```

**Web server:**
```bash
npm run server                      # Start at localhost:3000
```

### Key Files to Modify

**Adding a new exercise test:**
1. Create `tests/XX.test.js`
2. Export `test(studentFilePath)` function
3. Use `createTestCollector()` pattern
4. Return results with `getResults()`

**Modifying code quality rules:**
- Edit `tests/codeQuality.test.js`
- Adjust validators or add new ones
- Modify score penalties

**Changing report format:**
- Edit Pug templates in `src/views/`
- Or modify report generators in `src/services/report-generators/`

### Important Concepts

**Exercise Weight:**
- Default: 1
- Can be adjusted per exercise
- Affects final grade calculation

**Code Quality Score:**
- Range: -11 to 0
- Applied as multiplier to raw score
- Perfect code = no penalty

**Timeout:**
- Default: 500ms per execution
- Prevents infinite loops
- Configurable in `test.service.js`

**Mock Timer Behavior:**
- `setInterval`/`setTimeout` execute immediately
- Uses `setImmediate()` for fast-forward
- Max 1000 callback invocations safety limit

---

## Troubleshooting Guide

### Student code doesn't execute
- Check timeout (500ms default)
- Look for infinite loops
- Verify syntax errors in student code

### Tests fail unexpectedly
- Check mock responses match test inputs
- Verify regex patterns in tests
- Look at captured output in results

### Code quality false positives
- Review validators in `codeQuality.test.js`
- Comment stripping may affect detection
- Check for edge cases in validation regex

### Reports not generating
- Ensure `reports/` directory exists
- Check Pug template syntax
- Verify file permissions

---

## Summary

**The system works in 6 main steps:**

1. **Discover** student files using glob patterns
2. **Execute** student code in isolated VM sandbox
3. **Mock** browser APIs to capture behavior
4. **Test** code against requirements
5. **Grade** based on test results + code quality
6. **Report** results in various formats

**Key technologies:**
- Node.js `vm` module for sandboxing
- Express + Pug for web interface
- ESM modules throughout
- Dynamic test loading

**Design principles:**
- Safety first (sandboxing, timeouts)
- Flexibility (dynamic tests, multiple report types)
- Comprehensive feedback (detailed test results)
- Code quality matters (automated style checking)





