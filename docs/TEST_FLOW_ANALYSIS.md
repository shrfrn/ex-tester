# Test Flow Analysis - Naming & Simplification

## Current Flow Issues

### The Naming Problem

We have 4 similar-sounding functions for test execution:

1. **`test.controller.js::runTest()`** - HTTP endpoint handler
2. **`test.service.js::executeTest()`** - Service layer orchestration  
3. **`test-runner.js::runExerciseTests()`** - Multi-purpose router (single OR batch)
4. **`test-runner.js::runTests()`** - Actual test execution

**Confusion:**
- `runTest` (singular) vs `runTests` (plural) - sound too similar
- `executeTest` vs `runTest` - synonyms doing different things
- `runExerciseTests` (plural) can actually handle a single exercise
- No clear indication of what layer each function belongs to

---

## Current Flow Diagrams

### API Endpoint Flow (Single Exercise)

```
POST /api/test
  ↓
test.controller.js::runTest()              // HTTP: validate, parse req.body, file handling
  ├─ validateTestRequest()
  ├─ calls executeTest()
  └─ cleanupUploadedFile()
      ↓
test.service.js::executeTest()             // Service: orchestrate, format, report
  ├─ calls runExerciseTests()              // ← Only one call here
  ├─ formatStudentResult()
  ├─ generateReport()
  └─ userService.addActivities()
      ↓
test-runner.js::runExerciseTests()         // Router: handle single vs batch
  ├─ if (exerciseId && filePath)           // ← Single exercise path
  │   └─ calls runTests()
  └─ if (studentFolder && exerciseFiles)   // ← Batch path (NOT USED by API)
      └─ for each: calls runTests()
          ↓
test-runner.js::runTests()                 // Executor: load test file, run it
  ├─ import test file
  ├─ call test(filePath)
  ├─ add studentCode
  ├─ add codeQuality
  └─ calculate percentage
```

### Batch CLI Flow (Multiple Exercises)

```
CLI: node src/index.js
  ↓
index.js::batchTest()                      // CLI orchestration
  ├─ findStudentFolders()
  ├─ for each student:
  │   ├─ getStudentExercises()
  │   └─ calls runExerciseTests()          // ← Different params than API
  ├─ calculateStudentScores()
  └─ generateReport()
      ↓
test-runner.js::runExerciseTests()         // Router: handle single vs batch
  └─ if (studentFolder && exerciseFiles)   // ← Batch path
      └─ for each: calls runTests()
          ↓
test-runner.js::runTests()                 // Executor: same as API flow
```

---

## Problems Identified

### 1. Unnecessary Abstraction Layer

**test.service.js::executeTest()** doesn't do enough to justify its existence:

```javascript
export async function executeTest({ exerciseId, studentName, filePath }) {
    // Only does 3 things:
    const { results } = await runExerciseTests({ exerciseId, filePath })    // 1. Call runner
    const studentResult = formatStudentResult(studentName, exerciseId, results)  // 2. Format
    const htmlReport = generateReport([studentResult], 'htmlDetailedPug')   // 3. Generate report
    return htmlReport
}
```

This could be moved into the controller or merged with test-runner.

### 2. Confusing Multi-Purpose Function

**test-runner.js::runExerciseTests()** tries to handle two completely different cases:

```javascript
export async function runExerciseTests({ exerciseId, filePath, studentFolder, exerciseFiles }) {
    // Case 1: Single exercise with direct file path
    if (exerciseId && filePath) { ... }
    
    // Case 2: Multiple exercises from student folder
    if (studentFolder && exerciseFiles) { ... }
}
```

**Issues:**
- Two different parameter signatures merged into one
- Function name (plural "Tests") doesn't indicate it can handle single exercise
- Forces all callers to know which parameters to pass
- Returns different data structures for each case

### 3. Naming Doesn't Reflect Layers

| Function | What it does | What name suggests |
|----------|--------------|-------------------|
| `runTest` | HTTP handler | Test executor |
| `executeTest` | Format results | Test executor |
| `runExerciseTests` | Route single/batch | Test executor |
| `runTests` | Actually executes tests | Test executor |

All four sound like they execute tests, but only one actually does.

### 4. Inconsistent Return Formats

**runExerciseTests()** returns different structures:

```javascript
// Single exercise (API path)
return {
    exerciseId: '01',
    results: { score: 80, passed: [...], ... }
}

// Batch (CLI path)
return {
    '01': { score: 80, passed: [...], ... },
    '02': { score: 90, passed: [...], ... },
    // ...
}
```

This forces callers to handle two different formats.

---

## Proposed Solution

### Recognize Two Orchestrators + One Executor Pattern

**Current Architecture:**

```
TWO ORCHESTRATORS:
1. index.js::batchTest()           - CLI batch orchestrator
2. test.controller.js::runTest()   - HTTP single test orchestrator
                ↓
        (both call into)
                ↓
ONE EXECUTOR (confused):
test-runner.js::runExerciseTests() - tries to handle both with branching
```

### Option A: Clear Separation in Executor (Recommended)

**New structure:**

```
CLI FLOW:
node src/index.js
  ↓
index.js::main()                             // Parse CLI args
  ↓
index.js::batchTest()                        // Batch orchestrator
  ├─ findStudentFolders()
  ├─ getStudentExercises()
  ├─ for each student:
  │   └─ calls runStudentExercises()         // ← Renamed, clearer
  ├─ calculateStudentScores()
  ├─ save JSON
  └─ generateReport()
      ↓
test-runner.js::runStudentExercises()        // Execute multiple for one student
  └─ for each: calls runSingleExercise()
      ↓
test-runner.js::runSingleExercise()          // Core executor (shared)

──────────────────────────────────────────────

API FLOW:
POST /api/test
  ↓
test.controller.js::handleTestSubmission()   // HTTP orchestrator
  ├─ validateRequest()
  ├─ calls runSingleExercise()               // ← Direct call to core
  ├─ formatStudentResult()
  ├─ generateReport()
  ├─ addActivities()
  └─ cleanupFile()
      ↓
test-runner.js::runSingleExercise()          // Core executor (shared)
  ├─ load test file
  ├─ run test
  ├─ add student code
  ├─ add code quality
  └─ return results
```

**Key Changes:**
1. **Remove** `test.service.js` entirely - logic moves to controller
2. **Rename** controller: `runTest` → `handleTestSubmission`
3. **Split** test-runner functions:
   - `runSingleExercise(exerciseId, filePath)` - core executor (was `runTests`)
   - `runStudentExercises(studentFolder, exerciseFiles)` - batch helper (was batch path of `runExerciseTests`)
4. **Result:** Two clear orchestrators, one shared core executor

### Option B: Keep Simple Names (Alternative)

If we want more concise names:

```
test-runner.js:
  - runExercise()          // Core executor (singular = clear)
  - runExercises()         // Batch helper (plural = clear)

Controllers:
  - handleTestRequest()    // HTTP
  - batchTest()            // CLI (already clear)
```

---

## Proposed Naming Convention

### By Layer

| Layer | Pattern | Examples |
|-------|---------|----------|
| HTTP Controllers | `handle*` or `*Handler` | `handleTestSubmission` |
| Services | `process*`, `generate*`, `calculate*` | `processResults`, `generateReport` |
| Executors | `execute*` | `executeExerciseTest`, `executeExercisesForStudent` |
| Utilities | `format*`, `validate*`, `parse*` | `formatStudentResult`, `validateCode` |

### By Scope

| Scope | Naming |
|-------|--------|
| Single exercise | Use **singular**: `executeExerciseTest()` |
| Multiple exercises | Use **plural**: `executeExercisesForStudent()` |
| Generic/reusable | Use clear noun: `testExecutor()`, `scoreCalculator()` |

---

## Refactoring Plan

### Step 1: Simplify test-runner.js

**Before:**
```javascript
// Multi-purpose function with branching logic
export async function runExerciseTests({ exerciseId, filePath, studentFolder, exerciseFiles })

// Actual executor
export async function runTests(exerciseId, studentScript)
```

**After:**
```javascript
// Single exercise - clear, focused
export async function executeExerciseTest(exerciseId, filePath)

// Multiple exercises - clear, focused  
export async function executeExercisesForStudent(studentFolder, exerciseFiles)
```

### Step 2: Merge or Remove test.service.js

**Current test.service.js (45 lines, mostly fluff):**
- `executeTest()` - just calls runner + formats
- `formatStudentResult()` - helper function

**Options:**
1. **Move to controller** - keep HTTP and formatting together
2. **Move to test-runner** - keep execution and formatting together
3. **Delete** - inline the logic (it's only 3 function calls)

**Recommendation:** Move `formatStudentResult()` to a new `result-formatter.service.js`, delete `test.service.js`, inline logic into controller.

### Step 3: Rename Controller Function

**Before:**
```javascript
export async function runTest(req, res) {
```

**After:**
```javascript
export async function handleTestSubmission(req, res) {
```

Makes it immediately clear this is an HTTP handler, not a test executor.

### Step 4: Update Callers

**index.js (batch):**
```javascript
// Before
const testResults = await runExerciseTests({ studentFolder: student.path, exerciseFiles })

// After
const testResults = await executeExercisesForStudent(student.path, exerciseFiles)
```

**test.controller.js (API):**
```javascript
// Before
const htmlReport = await executeTest(testOptions)

// After  
const results = await executeExerciseTest(exerciseId, filePath)
const studentResult = formatStudentResult(studentName, exerciseId, results)
const htmlReport = await generateReport([studentResult], 'htmlDetailedPug')
```

---

## File Structure After Refactoring

```
src/
├── api/
│   └── test/
│       ├── test.controller.js          // handleTestSubmission()
│       └── test.routes.js
│
├── test-runner.js                      // executeExerciseTest(), executeExercisesForStudent()
│
└── services/
    ├── result-formatter.service.js     // formatStudentResult()
    ├── score.service.js
    └── report.service.js
```

**Removed:**
- `src/api/test/test.service.js` (unnecessary abstraction)

---

## Summary of Changes

### Architecture Before

```
TWO ORCHESTRATORS calling ONE confused executor:

index.js::batchTest()              test.controller.js::runTest()
        ↓                                      ↓
        └──────────────┬───────────────────────┘
                       ↓
            test.service.js::executeTest()  ← unnecessary layer
                       ↓
        test-runner.js::runExerciseTests()  ← confused multi-purpose
                       ↓
            test-runner.js::runTests()      ← actual executor
```

### Architecture After (Option A)

```
TWO ORCHESTRATORS calling clear, focused executors:

index.js::batchTest()              test.controller.js::handleTestSubmission()
        ↓                                      ↓
        ↓                                      ↓
test-runner.js::runStudentExercises()          ↓
        ↓                                      ↓
        └──────────────┬───────────────────────┘
                       ↓
          test-runner.js::runSingleExercise()  ← shared core executor
```

### File/Function Changes

| File | Current | Proposed (Option A) | Proposed (Option B) |
|------|---------|---------------------|---------------------|
| **test.controller.js** | `runTest()` | `handleTestSubmission()` | `handleTestRequest()` |
| **test.service.js** | `executeTest()` | **DELETE FILE** | **DELETE FILE** |
| **test-runner.js** | `runExerciseTests()` | **SPLIT** ↓ | **SPLIT** ↓ |
| → batch path | (inside above) | `runStudentExercises()` | `runExercises()` |
| → single path | (inside above) | **DELETE** (redundant) | **DELETE** (redundant) |
| **test-runner.js** | `runTests()` | `runSingleExercise()` | `runExercise()` |
| **index.js** | `batchTest()` | No change (already clear) | No change |

### What Gets Simpler

**Before:**
```javascript
// API path
runTest() → executeTest() → runExerciseTests() → runTests()
                            ↑ branches here

// CLI path  
batchTest() → runExerciseTests() → runTests()
              ↑ branches here
```

**After (Option B - cleaner names):**
```javascript
// API path
handleTestRequest() → runExercise()

// CLI path
batchTest() → runExercises() → runExercise()
```

**Benefits:**
- ✅ Removes unnecessary abstraction (test.service.js)
- ✅ Clear singular vs plural naming
- ✅ No more branching in executor
- ✅ Orchestrators directly call what they need
- ✅ Each function has ONE clear purpose
- ✅ Consistent return types


