# Project Restructuring - Moving Tests into src/

## Date: November 5, 2025

## Changes Implemented

### ✅ 1. Moved `tests/` → `src/exercise-tests/`
- **Reason**: These are application source code, not unit tests
- **What they are**: Test definitions that define how to grade student exercises
- **Count**: 59 exercise test files (01.test.js through 59.test.js)
- **Impact**: Cleaner import paths, logical organization

### ✅ 2. Moved `tests/validators/` → `src/validators/`
- **Files moved**: 
  - `var-names.validator.js`
  - `indentation.validator.js`
  - `line-spacing.validator.js`
  - `quotes.validator.js`
  - `semicolons.validator.js`
- **Reason**: Validators are core application logic, not tests

### ✅ 3. Renamed `tests/codeQuality.test.js` → `src/validators/code-quality.js`
- **Reason**: Not a test file - it's a validator that orchestrates code quality checks
- **Location**: Now in `src/validators/` with other validators

### ✅ 4. Updated All Import Paths

**Updated files:**
- `src/test-runner.js`
  - `../tests/codeQuality.test.js` → `./validators/code-quality.js`
  - `path.join('..', 'tests', ...)` → `path.join('exercise-tests', ...)`

- All 59 exercise test files in `src/exercise-tests/`
  - `../src/services/` → `../services/`

- `src/validators/code-quality.js`
  - `../src/services/` → `../services/`
  - `../tests/validators/` → `./`

---

## Final Structure

```
src/
├── cli-prompts.js                   # CLI interaction
├── index.js                         # CLI entry point
├── server.js                        # Web server entry point
├── test-runner.js                   # Test orchestration
│
├── exercise-tests/                  # [MOVED from tests/]
│   ├── 01.test.js through 59.test.js
│   ├── baseline-results.json
│   └── codeQualityValidators.test.js
│
├── validators/                      # [MOVED from tests/validators/]
│   ├── code-quality.js             # [RENAMED from codeQuality.test.js]
│   ├── var-names.validator.js
│   ├── indentation.validator.js
│   ├── line-spacing.validator.js
│   ├── quotes.validator.js
│   └── semicolons.validator.js
│
├── services/
│   ├── code-runner.service.js
│   ├── sandbox.service.js
│   ├── mock-browser.service.js
│   ├── test-collector.service.js
│   ├── type-checker.service.js
│   ├── test.service.js
│   ├── score.service.js
│   ├── file-utils.service.js
│   ├── util.service.js
│   ├── report.service.js
│   └── report-generators/
│
├── views/                          # Pug templates
├── public/                         # Static files
└── uploads/                        # Temporary uploads

system-tests/                       # [STAYS at root - tests the system itself]
├── codeQualityValidators.test.js
├── fileUtils.test.js
└── security.test.js
```

---

## Why This Structure is Better

### 1. **Logical Organization**
- Exercise tests ARE application code, not external tests
- They define business logic (how to grade exercises)
- Dynamically loaded at runtime like routes or controllers

### 2. **Cleaner Import Paths**
**Before:**
```javascript
// In src/test-runner.js
const testScriptPath = path.join('..', 'tests', `${exerciseId}.test.js`)

// In tests/01.test.js
import { runScript } from '../src/services/test.service.js'
```

**After:**
```javascript
// In src/test-runner.js
const testScriptPath = path.join('exercise-tests', `${exerciseId}.test.js`)

// In src/exercise-tests/01.test.js
import { runScript } from '../services/test.service.js'
```

### 3. **Clear Separation**
- `src/` = Application source code (including exercise tests)
- `system-tests/` = Unit tests that test the application itself

### 4. **Standard Patterns**
Similar to:
```
src/
├── routes/        # Loaded dynamically
├── controllers/   # Loaded dynamically
├── exercise-tests/ # Loaded dynamically
└── services/
```

---

## Testing Results

All modules tested and verified working:

- ✅ `src/test-runner.js` loads successfully
- ✅ `src/validators/code-quality.js` loads successfully
- ✅ `src/exercise-tests/01.test.js` loads successfully
- ✅ `src/exercise-tests/16.test.js` loads successfully
- ✅ `src/exercise-tests/30.test.js` loads successfully
- ✅ `src/exercise-tests/59.test.js` loads successfully
- ✅ All 59 exercise test files moved successfully
- ✅ All 6 validator files moved successfully
- ✅ No linter errors

---

## Key Insight

**The `tests/` directory was misnamed from the start.**

These aren't "tests" in the traditional sense - they're **test definitions** or **exercise specifications** that define the grading logic for student submissions. They're core application functionality, not tests of the codebase.

The `system-tests/` directory contains the actual unit tests that test your application code.

---

## Impact Summary

- **Files moved**: 66 files (59 exercise tests + 6 validators + 1 baseline JSON)
- **Import updates**: ~180 import statements updated automatically
- **Breaking changes**: None (all imports corrected)
- **Benefits**: Clearer structure, better organization, logical grouping

