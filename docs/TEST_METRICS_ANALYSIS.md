# Test Metrics Calculation - Analysis & Issues

## Executive Summary

The test metrics calculation system has grown organically and now contains significant inconsistencies, redundancies, and architectural issues. This document analyzes the current state and identifies areas requiring refactoring.

**Key Issue:** The 20-point "Code executes successfully" check is fundamentally flawed - it awards points for basic execution rather than correctness, and when removed, scoring doesn't normalize to 0-100.

---

## Test Result Data Structure

### 1. Individual Test Result Object (from test files)

**Location:** Returned by `test()` functions in `/src/exercise-tests/*.test.js`

**Structure:**
```javascript
{
  // From test-collector.service.js
  passed: [{ description, score }, ...],      // Array of passed tests
  failed: [{ description, score }, ...],      // Array of failed tests
  score: 80,                                  // Raw points earned (sum of passed scores)
  count: 10,                                  // Total number of tests run
  maxScore: 100,                              // Maximum possible points (sum of all scores)
  percentage: 80,                             // (score / maxScore) * 100
  
  // Added by test files
  success: true/false,                        // Whether code executed without errors
  error: 'error message',                     // Error message if execution failed
  weight: 1,                                  // Exercise weight (for batch grading)
  studentCode: '...',                         // Full student code
  
  // Added by test-runner.js
  codeQuality: {                              // Code quality analysis
    score: -5,                                // Penalty (0 to -30)
    results: [...]                            // Quality violation details
  },
  
  // Added by score.service.js (batch only)
  normalizedScore: 85,                        // Score after quality factor applied
  
  // Legacy/unused
  correctOutput: undefined,                   // Never set by any test
  submitted: true/false                       // Only used when no code found
}
```

### 2. Student Result Object (for reporting)

**Location:** Created by `formatStudentResult()` in `/src/api/test/test.service.js` (API tests) or in `/src/index.js` (batch tests)

**Structure:**
```javascript
{
  name: 'Student Name',                       // Student name
  folderPath: '/path/to/folder',              // Source folder (batch) or empty (API)
  
  testResults: {                              // Map of exercise results
    '01': { ...individualTestResult },
    '02': { ...individualTestResult },
    // ...
  },
  
  scores: {                                   // Student-level aggregated scores
    submissionRate: 0.85,                     // Fraction of exercises submitted
    normalizedScore: 87,                      // Final weighted score (0-100)
    submittedCount: 17,                       // Number of exercises submitted
    totalExercises: 20,                       // Total exercises assigned
    successfulCount: 15,                      // Exercises that executed successfully
    successRate: 0.75                         // Fraction that executed successfully
  },
  
  exercisesText: '1-5, 7, 9-12'              // Human-readable exercise list (added by report generators)
}
```

---

## Data Flow Architecture

### Client API Flow (`/api/test` endpoint)

```
1. Student submits file → /api/test endpoint
   └─ test.controller.js::runTest()

2. Controller → test.service.js::executeTest()
   └─ Calls runExerciseTests({ exerciseId, filePath })
   
3. test-runner.js::runExerciseTests()
   └─ Calls runTests(exerciseId, filePath)
      └─ Loads test file (e.g., 01.test.js)
      └─ Calls test(filePath)
         └─ Returns { passed, failed, score, maxScore, success, ... }
      └─ Adds studentCode (re-read from file - REDUNDANT)
      └─ Adds codeQuality analysis
      └─ Calculates percentage = (score / maxScore) * 100
   
4. test.service.js::formatStudentResult()
   └─ Wraps result in student object structure
   └─ Creates placeholder scores object (INCORRECT - doesn't normalize or apply quality)
   
5. generateReport([studentResult], 'htmlDetailedPug')
   └─ Renders Pug template with raw data
   
6. Returns HTML to client
```

**Issues:**
- `formatStudentResult()` doesn't normalize scores properly (has TODO comment)
- Student code is read twice (once in test file, again in test-runner)
- No score normalization happens for API tests
- Code quality factor not applied to final score
- Single-exercise scores object is inconsistent with batch format

### Batch Test Flow

```
1. CLI: node src/index.js --path ... --exercises ...
   └─ index.js::batchTest()

2. For each student:
   └─ runExerciseTests({ studentFolder, exerciseFiles })
      └─ Same as API flow for each exercise
      
3. calculateStudentScores(studentResults, exerciseCount)
   └─ For each submitted exercise:
      └─ normalizedScore = (score / maxScore) * 100
      └─ Apply code quality: normalizedScore *= (100 + codeQuality.score) / 100
      └─ Store as result.normalizedScore
      └─ Accumulate weighted scores
   └─ Calculate student-level aggregates
   
4. Save results.json
   
5. generateReport(studentResults, reportType)
   └─ Renders report using normalized scores
```

**Issues:**
- Score calculation only happens for batch tests, not API tests
- Normalization logic duplicated across services
- TODO comment: "result calc needs to be fixed"

---

## Test File Patterns Analysis

### Pattern Distribution (60 total test files)

1. **Standard Pattern** (52 files): Early return on execution failure
   ```javascript
   checkAndRecord('Code executes successfully', result.success, 20)
   if (!result.success) return executionFailed(result, studentCode)
   // ... remaining tests (80 points total)
   return { ...getResults(), success: result.success, weight: 1, studentCode }
   ```

2. **Multiple Test Cases Pattern** (2 files: 30, 32): Check execution per test case
   ```javascript
   testCases.forEach(testCase => {
     const result = runScript(studentCode, testCase.inputs)
     checkAndRecord(`Execution for "${inputs}" succeeds`, result.success, 10)
     if (!result.success) {
       checkAndRecord(testCase.description, false, testCase.points)
       return
     }
     checkAndRecord(testCase.description, ..., testCase.points)
   })
   return { ...getResults(), success: true, error: null, weight: 1, studentCode }
   ```
   **Issue:** Always returns `success: true` even if some executions failed

3. **Variant Pattern** (3 files): Check success but don't use `executionFailed()`
   ```javascript
   checkAndRecord('Code executes successfully', result.success, 20)
   if (!result.success) return executionFailed(result, studentCode)  // Missing in 3 files
   ```

4. **Unsubmitted Pattern** (handled by all files):
   ```javascript
   if (!studentCode) return { submitted: false }
   ```

### Score Point Distribution

- **"Code executes successfully" check:** 20 points (55/60 files)
  - **Exception:** Tests 30, 32 use 10 points per test case
  - **Exception:** Tests 58, 59 use 10 points instead of 20
- **Remaining tests:** Variable (typically 10 points each, totaling 80-90)
- **Total maxScore:** Usually 100-110 points

**Critical Issue:** The 20-point execution check is a binary gate that:
1. Awards points simply for not crashing (not for correctness)
2. Makes the remaining 80 points effectively 0-80, not 0-100
3. Creates inconsistent scoring when removed

---

## Reporting Layer Data Usage

### Pug Templates Data Consumption

**`views/reports/student-detailed.pug`:**
```pug
each result, exerciseId in student.testResults
  if result && result.submitted !== false
    +exerciseDetails(exerciseId, result)
```

**`views/components/exercise-details.pug`:**
```pug
- const scorePercentage = result.normalizedScore ? `${result.normalizedScore}%` 
                        : (result.percentage ? `${result.percentage}%` : 'N/A')
- const codeQualityScore = `${100 + result.codeQuality.score}%`

// Displays:
td= scorePercentage          // Shows score
td= codeQualityScore         // Shows quality (100 + penalty)
td checkbox result.success   // Execution success
td checkbox result.correctOutput  // NEVER SET - always unchecked
```

**`views/components/student-summary.pug`:**
```pug
td #{student.exercisesText} (#{student.scores.totalExercises})
td #{Math.round(student.scores.submissionRate * 100)}%
td #{Math.round(student.scores.successRate * 100)}% (#{student.scores.successfulCount})
td #{student.scores.normalizedScore}
```

**Issues:**
- `result.correctOutput` is displayed but never set by any test
- Fallback logic for scores (normalizedScore vs percentage) indicates uncertainty
- API tests show `percentage` (unadjusted), batch shows `normalizedScore` (adjusted)
- Code quality shown as `100 + score` (e.g., "95%") is confusing - it's a penalty, not a score

---

## Critical Issues & Redundancies

### 1. ❌ The "Code Executes Successfully" Problem

**Current Behavior:**
```javascript
checkAndRecord('Code executes successfully', result.success, 20)  // 20 points for not crashing
// ... other tests worth 80 points
// Total: 100 points
```

**Problems:**
- Awards 20% just for running without errors (not correctness)
- Makes actual functionality tests worth only 80% of grade
- When removed, tests don't auto-scale to 0-100
- Inconsistent across test files (some use 10, some 20)
- Should be a prerequisite, not a scored metric

**User's New Requirement:**
- If code fails to execute, return early with no other metrics
- If succeeds, don't award points - just run tests
- Normalize remaining test scores to 0-100 range

### 2. ❌ Duplicate Score Calculations

**Three different normalization logics:**

1. **test-collector.service.js** (all tests):
   ```javascript
   percentage: Math.round((results.score / results.maxScore) * 100)
   ```

2. **test-runner.js** (API and batch):
   ```javascript
   results.percentage = Math.round((results.score / results.maxScore) * 100)
   ```

3. **score.service.js** (batch only):
   ```javascript
   let normalizedScore = Math.min(100, Math.round((result.score / result.maxScore) * 100))
   normalizedScore = Math.min(100, Math.round(normalizedScore * codeQualityFactor))
   ```

**Issues:**
- Calculation duplicated in 3 places
- API tests don't apply code quality factor
- Inconsistent capping (some use Math.min, some don't)

### 3. ❌ API vs Batch Inconsistency

| Feature | API Tests | Batch Tests |
|---------|-----------|-------------|
| Score normalization | Basic (percentage) | With quality factor |
| Student scores object | Placeholder/incorrect | Properly calculated |
| Code quality applied | ❌ No | ✅ Yes |
| `normalizedScore` field | ❌ Not set | ✅ Set |
| Multiple exercises | Single only | Multiple |

### 4. ❌ Redundant Data

**Student code read twice:**
```javascript
// In test file (e.g., 01.test.js)
let studentCode = stripComments(studentFilePath)  // Read #1
// ...
return { ...getResults(), studentCode }           // Included in result

// In test-runner.js
results.studentCode = fs.readFileSync(studentScript, 'utf8')  // Read #2 - OVERWRITES
```
**Issue:** Code is read, processed, and passed back, only to be overwritten

**Unused fields:**
- `result.correctOutput` - displayed in templates but never set
- `result.weight` - only used in batch scoring, always = 1
- `result.count` - number of tests run, never displayed or used

**Questionable fields:**
- `result.percentage` vs `result.normalizedScore` - confusing duplication
- `result.success` (execution) vs actual test pass rate - conflated

### 5. ❌ Code Quality Display Confusion

```pug
- const codeQualityScore = `${100 + result.codeQuality.score}%`
```

**Current:**
- `codeQuality.score` = -5 (a penalty)
- Display: "95%" 
- **Confusing:** Looks like a score, but it's really showing quality factor

**Better approach:**
- Show penalty directly: "-5 pts" or "5% penalty"
- Or show violations count: "2 issues"

### 6. ❌ Inconsistent Success Semantics

**`success` field conflates two meanings:**

1. **Execution success** - did code run without errors?
   ```javascript
   const result = runScript(studentCode, inputs)
   result.success  // true if no runtime errors
   ```

2. **Test success** - did student pass tests?
   ```javascript
   return { ...getResults(), success: result.success, ... }
   ```

**Issue:** A student can have `success: true` but fail all functional tests

**Test 30 example:**
```javascript
testCases.forEach(testCase => {
  const result = runScript(studentCode, testCase.inputs)
  if (!result.success) {
    checkAndRecord(testCase.description, false, testCase.points)
  }
})
return { ...getResults(), success: true, ... }  // ALWAYS TRUE
```
This can return `success: true` even if multiple test cases failed execution!

### 7. ❌ formatStudentResult() Issues

**File:** `src/api/test/test.service.js`

```javascript
function formatStudentResult(studentName, exerciseId, results) {
    // TODO: This needs to be re-thought

    return {
        name: studentName,
        folderPath: '',
        testResults: { [exerciseId]: results, },
        scores: {
            submissionRate: 1,
            exerciseScore: results.score || 0,          // RAW score, not normalized
            normalizedScore: results.score || 0,        // WRONG - not actually normalized
            submittedCount: 1,
            totalExercises: 1,
            successfulCount: results.success ? 1 : 0,
            successRate: results.success ? 1 : 0,
        },
    }
}
```

**Issues:**
- `normalizedScore` is set to raw `score`, not normalized to 0-100
- Code quality factor not applied
- `exerciseScore` and `normalizedScore` are identical (both wrong)
- Placeholder values for single exercise don't align with report expectations

### 8. ❌ Score Capping Inconsistency

**In test-runner.js:**
```javascript
results.score = Math.min(results.score, results.maxScore)  // Cap score to maxScore
```

**In score.service.js:**
```javascript
let normalizedScore = Math.min(100, Math.round((result.score / result.maxScore) * 100))
```

**Issue:** Score is capped in two places for different reasons:
1. First to prevent score > maxScore (defensive)
2. Second to prevent percentage > 100% (defensive)

**Questions:**
- Can score ever exceed maxScore? (Probably not with current implementation)
- Is double-capping necessary or redundant?

---

## Data Field Usage Analysis

### Fields That ARE Used

| Field | Set By | Used By | Purpose |
|-------|--------|---------|---------|
| `passed` | test-collector | Pug templates | Display passed tests |
| `failed` | test-collector | Pug templates | Display failed tests |
| `score` | test-collector | score.service, test-runner | Raw points earned |
| `maxScore` | test-collector | score.service, test-runner | Maximum possible |
| `percentage` | test-runner, test-collector | Pug templates (fallback) | Basic score % |
| `success` | Test files, code-runner | Templates, score calc | Execution status |
| `error` | code-runner, Test files | Templates | Error messages |
| `studentCode` | test-runner | Templates, reports | Display code |
| `codeQuality` | test-runner | score.service, templates | Quality analysis |
| `normalizedScore` | score.service | Pug templates (primary) | Adjusted score |
| `weight` | Test files | score.service | Exercise importance |
| `submitted` | Test files | score.service, templates | Submission status |

### Fields That ARE NOT Used

| Field | Set By | Used By | Notes |
|-------|--------|---------|-------|
| `correctOutput` | NOWHERE | Pug templates (checked but always undefined) | **DEAD FIELD** |
| `count` | test-collector | NOWHERE | Number of tests run - never displayed |

### Fields With Problematic Usage

| Field | Issue |
|-------|-------|
| `studentCode` | Read twice, first read overwritten |
| `percentage` | Calculated twice, inconsistent with `normalizedScore` |
| `success` | Conflates execution success with test pass rate |
| `normalizedScore` | Only set in batch flow, not API flow |
| `weight` | Always 1, no variation found in any test file |

---

## Score Calculation Logic Issues

### Current Formula (Batch Tests Only)

```javascript
// Per exercise
normalizedScore = (score / maxScore) * 100
normalizedScore = normalizedScore * (100 + codeQuality.score) / 100
normalizedScore = Math.min(100, normalizedScore)

// Across exercises
finalScore = (Σ normalizedScore × weight) / Σ weight
```

**Problems:**

1. **Code quality can push scores over 100:**
   - If `score = 100` and `codeQuality.score = 5` (bonus?), result = 105
   - Requires Math.min capping
   - Question: Can code quality ever be positive? Should it?

2. **Weight is always 1:**
   - No test file has weight ≠ 1
   - Weighted average reduces to simple average
   - Dead feature or future-proofing?

3. **Not applied to API tests:**
   - Inconsistent scoring between batch and API
   - API tests show raw percentage without quality adjustment

### Desired Formula (Per User Requirements)

```javascript
// If execution fails
return early, no metrics

// If execution succeeds
// Don't award points for execution
// Normalize functional test scores to 0-100

maxScoreWithoutExecution = maxScore - 20  // Remove execution check points
scoreWithoutExecution = score - (execution ? 20 : 0)  // Remove execution points if passed
normalizedScore = (scoreWithoutExecution / maxScoreWithoutExecution) * 100

// Then apply code quality
normalizedScore = normalizedScore * (100 + codeQuality.score) / 100
normalizedScore = Math.max(0, Math.min(100, normalizedScore))
```

**Concerns:**
1. What if tests don't follow standard 20-point execution pattern?
2. What if maxScore < 20?
3. How to handle edge cases gracefully?

---

## Recommendations Summary

### High Priority Refactoring

1. **❗ Remove "Code executes successfully" as a scored metric**
   - Make it a prerequisite check only
   - Normalize remaining tests to 0-100 range
   - Update all 55+ test files consistently

2. **❗ Unify score normalization logic**
   - Single source of truth for score calculation
   - Apply code quality factor in both API and batch flows
   - Remove duplicate calculations

3. **❗ Fix formatStudentResult() for API tests**
   - Apply proper score normalization
   - Apply code quality factor
   - Make consistent with batch scoring

4. **❗ Clarify `success` field semantics**
   - Separate execution success from test pass rate
   - Consider: `executionSuccess` vs `testsPassed` or `passRate`

### Medium Priority Cleanup

5. **Remove redundant student code read**
   - Read once, pass through, don't overwrite

6. **Remove dead fields**
   - `correctOutput` - never set, remove from templates
   - `count` - never used, remove or document purpose

7. **Clarify score field names**
   - `percentage` vs `normalizedScore` - pick one or document difference
   - Consider renaming for clarity

8. **Fix code quality display**
   - Show as penalty ("-5 pts") not percentage ("95%")
   - Make semantics clearer

### Low Priority / Future

9. **Evaluate weight feature**
   - Always 1 in current tests
   - Remove if not needed, or document intended use

10. **Consolidate score capping**
    - Single defensive cap at end of calculation
    - Document why capping is necessary

11. **Handle test file variations**
    - Tests 30, 32 with multiple execution checks
    - Tests with non-standard point distributions
    - Ensure normalization works for all patterns

---

## Open Questions

1. **Should code quality score ever be positive?**
   - Currently only penalties (0 to -30)
   - If yes, capping at 100 makes sense
   - If no, capping is unnecessary

2. **What's the purpose of the `weight` field?**
   - Always 1 in current implementation
   - Future feature for exercise importance?
   - Should it be removed?

3. **How should "success" be defined?**
   - Execution without errors?
   - Passing a threshold of tests (e.g., 50%)?
   - Separate field for each concept?

4. **Should API and batch tests have different scoring?**
   - Current state: API doesn't apply quality factor
   - Intended or bug?

5. **What should happen with tests that have non-standard patterns?**
   - Test 30, 32: Multiple execution checks
   - Tests 58, 59: 10-point execution check instead of 20
   - Handle specially or enforce standard?

6. **Should maxScore always be 100?**
   - Or is variation acceptable (e.g., 110, 90)?
   - Affects normalization strategy

---

## Files Requiring Changes

### Core Logic
- `src/services/test-collector.service.js` - Test collection and basic scoring
- `src/services/score.service.js` - Score normalization (batch)
- `src/test-runner.js` - Test execution orchestration
- `src/api/test/test.service.js` - API test formatting

### Test Files (55+ files)
- All `src/exercise-tests/*.test.js` files need review
- Remove or adjust "Code executes successfully" scoring
- Ensure consistent patterns

### Templates
- `src/views/components/exercise-details.pug` - Remove `correctOutput`, clarify scoring
- `src/views/components/student-summary.pug` - Verify data expectations

### Documentation
- Update `docs/SYSTEM_OVERVIEW.md` with new scoring logic
- Document intended behavior clearly

---

## Conclusion

The test metrics system needs significant refactoring to:
1. Remove the problematic 20-point execution check from scoring
2. Normalize functional test scores to 0-100 consistently
3. Unify API and batch test scoring logic
4. Clean up redundant and unused data fields
5. Clarify semantic meaning of fields like `success`

The current system works but has accumulated technical debt from organic growth. A systematic refactoring following these recommendations will create a clearer, more maintainable, and more consistent scoring system.




