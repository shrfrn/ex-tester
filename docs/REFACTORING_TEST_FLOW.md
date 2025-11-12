# Test Flow Refactoring - Implementation Summary

## Date: November 12, 2025

## Objective

Simplify and clarify the test execution flow by:
1. Removing unnecessary abstraction layers
2. Clarifying naming (controller vs service responsibilities)
3. Separating API and batch orchestration
4. Creating a single core test execution function

---

## Changes Made

### 1. Created New Core Service

**File:** `src/services/test.service.js`

**Function:** `execute(exerciseId, filePath)`

**Responsibilities:**
- Load test file
- Run test
- Analyze code quality
- Normalize scores
- Return standardized result

**Key Logic:**
```javascript
export async function execute(exerciseId, filePath) {
    // Load test file
    const { test } = await import(testFilePath)
    const result = test(filePath)
    
    // Add student code
    result.studentCode = fs.readFileSync(filePath, 'utf8')
    
    // Analyze quality
    result.codeQuality = analyzeCodeQuality(filePath)
    
    // Normalize score (per-test normalization)
    result.percentage = (result.score / result.maxScore) * 100
    const qualityFactor = (100 + codeQuality.score) / 100
    result.normalizedScore = result.percentage * qualityFactor
    
    return result
}
```

### 2. Created Batch Orchestrator

**File:** `src/batch-runner.js`

**Function:** `runBatch({ submissionsPath, exerciseNumbers, reportType })`

**Responsibilities:**
- Find student folders
- Loop through students
- Loop through exercises
- Call `test.service.execute()` for each
- Calculate aggregate scores
- Generate batch report
- Save results to file

**Key Logic:**
```javascript
export async function runBatch(config) {
    // Loop students
    for (const student of studentFolders) {
        // Loop exercises
        for (const file of exerciseFiles) {
            // Use core service
            testResults[exerciseId] = await testService.execute(exerciseId, filePath)
        }
    }
    
    // Aggregate calculations
    calculateAggregateScores(studentResults, totalExercises)
    
    // File-based reporting
    saveResultsToFile(studentResults)
    generateReport(studentResults, reportType)
}
```

### 3. Updated API Controller

**File:** `src/api/test/test.controller.js`

**Function:** `handleSubmission(req, res)` (renamed from `runTest`)

**Responsibilities:**
- HTTP: Validate request
- Call `test.service.execute()`
- Format result for single-exercise report
- Generate HTML report
- Log activity to database (API-specific)
- HTTP: Send response and cleanup

**Key Changes:**
- Renamed from `runTest` to `handleSubmission` (clearer intent)
- Orchestrates full API flow
- Directly calls `test.service.execute()` (no intermediate layer)
- Handles API-specific concerns (DB logging, temp file cleanup)

### 4. Simplified CLI Entry Point

**File:** `src/index.js`

**Changes:**
- Removed inline `batchTest()` function
- Delegates to `batch-runner.js::runBatch()`
- Focused on CLI argument parsing only

**Before:** 75 lines (parsing + orchestration)  
**After:** 28 lines (parsing only)

### 5. Updated Route

**File:** `src/api/test/test.routes.js`

**Change:** Updated import to use new function name
```javascript
// Before
import { runTest } from './test.controller.js'
router.post('/', requireAuth, upload.single('file'), runTest)

// After
import { handleSubmission } from './test.controller.js'
router.post('/', requireAuth, upload.single('file'), handleSubmission)
```

---

## Files Deleted

1. **`src/test-runner.js`** - Replaced by `test.service.js`
2. **`src/api/test/test.service.js`** - Unnecessary wrapper, logic moved to controller
3. **`src/services/score.service.js`** - No longer imported (logic inlined)

---

## Architecture Before vs After

### Before (Confusing)

```
API Flow:
test.controller.js::runTest()
  └─ test.service.js::executeTest()           ← unnecessary wrapper
      └─ test-runner.js::runExerciseTests()   ← branching multi-purpose
          └─ test-runner.js::runTests()       ← actual execution

Batch Flow:
index.js::batchTest()
  └─ test-runner.js::runExerciseTests()       ← same branching function
      └─ test-runner.js::runTests()
```

**Problems:**
- 4 functions with similar names (runTest, executeTest, runExerciseTests, runTests)
- Unnecessary abstraction (test.service.js did almost nothing)
- runExerciseTests() tried to handle both single and batch with parameter branching
- Unclear separation of concerns

### After (Clear)

```
API Flow:
test.controller.js::handleSubmission()
  ├─ test.service.execute()                   ← core
  ├─ report.service.generate()                ← reporting
  └─ activity.service.log()                   ← DB (API-only)

Batch Flow:
index.js::main()
  └─ batch-runner.js::runBatch()
      ├─ test.service.execute()               ← same core
      ├─ calculateAggregateScores()           ← batch-specific
      └─ report.service.generate()            ← reporting
```

**Benefits:**
- Clear naming: `handleSubmission` (HTTP), `runBatch` (CLI), `execute` (core)
- Single source of truth: `test.service.execute()` is THE test executor
- Separation of concerns: API vs batch orchestration
- Thin service: does one thing well

---

## Function Naming Clarity

| Function | Layer | Purpose |
|----------|-------|---------|
| `handleSubmission()` | Controller (HTTP) | Handle HTTP request/response |
| `runBatch()` | Orchestrator (CLI) | Orchestrate batch testing |
| `execute()` | Service (Core) | Execute single test |
| `generate()` | Service (Reporting) | Generate report |
| `log()` | Service (DB) | Log activity |

---

## Data Flow

### Single Test (API)

```
1. HTTP Request arrives
2. Controller validates, extracts parameters
3. Controller calls test.service.execute(exerciseId, filePath)
   └─ Returns: { score, normalizedScore, codeQuality, passed[], failed[], ... }
4. Controller wraps in studentResult format
5. Controller calls report.service.generate([studentResult], 'htmlDetailedPug')
6. Controller calls activity.service.log() (API-specific)
7. Controller sends HTML response
8. Controller cleans up temp file
```

### Batch Tests (CLI)

```
1. CLI args parsed
2. batch-runner.js loops students and exercises
3. For each, calls test.service.execute(exerciseId, filePath)
   └─ Returns: { score, normalizedScore, codeQuality, ... }
4. batch-runner.js accumulates results
5. batch-runner.js calculates aggregate scores
   └─ Adds: submissionRate, successRate, aggregated normalizedScore
6. batch-runner.js saves results.json
7. batch-runner.js calls report.service.generate(allResults, 'htmlDetailed')
```

---

## Key Architectural Decisions

### 1. **Why No Separate test-runner.js?**

The "runner" logic is simple enough to live in `test.service.js`. The service:
- Loads test file
- Runs it
- Adds metadata (code, quality)
- Normalizes score

No need for an extra layer.

### 2. **Why Controller Orchestrates?**

Controllers know about:
- HTTP specifics (file uploads, response format)
- API-specific side effects (DB logging)
- Which report format to use

Services should be pure business logic. Since DB logging is API-specific, orchestration belongs in controller.

### 3. **Why Separate batch-runner.js?**

Batch testing has:
- Different orchestration (nested loops)
- Aggregate score calculation
- File-based output (not HTTP)
- No DB logging

It's essentially a different "controller" for CLI interface.

### 4. **Why Not formatResultForReport()?**

`test.service.execute()` returns a standardized, detailed result. The controller/batch-runner can wrap it as needed. No separate formatting function required.

---

## Score Calculation (To Be Reviewed Later)

Current implementation:

**Per-test (in service):**
```javascript
percentage = (score / maxScore) * 100
qualityFactor = (100 + codeQuality.score) / 100
normalizedScore = percentage * qualityFactor
```

**Aggregate (in batch-runner):**
```javascript
totalScore = Σ(normalizedScore × weight)
totalWeight = Σ(weight)
aggregateScore = totalScore / totalWeight
```

**Note:** User indicated score metrics need review, so this is subject to change.

---

## Testing Notes

- No linting errors introduced
- No broken imports
- File structure cleaner and more intuitive
- Each function has a single, clear purpose

---

## Next Steps (Per User)

1. ✅ Refactoring complete
2. ⏳ Score metrics review (deferred)
3. ⏳ Remove "Code executes successfully" 20-point check (from TEST_METRICS_ANALYSIS.md)
4. ⏳ Normalize remaining tests to 0-100 (from TEST_METRICS_ANALYSIS.md)

---

## Files Changed

### Created
- `src/services/test.service.js` (61 lines)
- `src/batch-runner.js` (82 lines)

### Modified
- `src/api/test/test.controller.js` (renamed function, restructured)
- `src/api/test/test.routes.js` (updated import)
- `src/index.js` (simplified from 75 to 28 lines)

### Deleted
- `src/test-runner.js`
- `src/api/test/test.service.js`

**Net Result:** Clearer architecture with fewer lines of code overall.

