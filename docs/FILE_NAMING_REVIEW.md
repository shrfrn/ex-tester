# File Naming Review & Recommendations

## Overview
This document reviews all files in the `src/` directory, analyzes their actual purpose, and provides recommendations for better naming and organization.

---

## Current File Structure Analysis

### Root Level Files (`src/`)

| Current Name | What It Does | Issue | Recommendation |
|--------------|--------------|-------|----------------|
| `index.js` | CLI entry point - orchestrates batch testing of multiple students | ✅ Good | Keep as-is (standard entry point) |
| `server.js` | Express server - web interface for testing exercises | ✅ Good | Keep as-is (standard server file) |
| `test-runner.js` | Orchestrates exercise test execution and loads test files | ✅ Good | Keep as-is |
| `score-calc.js` | Calculates student scores from test results | ⚠️ Inconsistent | **Rename to `score-calculator.service.js`**<br>**Move to `services/`** |
| `prompt.js` | Interactive CLI prompts for user input | ⚠️ Vague name | **Rename to `cli-prompt.service.js`**<br>**Move to `services/`** |

---

### Services Directory (`src/services/`)

| Current Name | What It Does | Issue | Recommendation |
|--------------|--------------|-------|----------------|
| `test-runner.service.js` | Runs student code/functions in sandbox - NOT a test runner | ❌ **Misleading** | **Rename to `code-executor.service.js`**<br>Executes student code, not tests |
| `test.service.js` | Re-exports functions from other services for backward compatibility | ⚠️ Confusing | **Consider removing** - prefer direct imports<br>If keeping: rename to `test-helpers.service.js` |
| `test-collector.service.js` | Creates test result collectors for tracking pass/fail | ✅ Good | Keep as-is |
| `sandbox.service.js` | Provides VM sandbox for code execution | ✅ Good | Keep as-is |
| `type-checker.service.js` | Type checking utilities for validating return values | ✅ Good | Keep as-is |
| `mock-browser.service.js` | Mocks browser APIs (console, prompt, etc.) | ✅ Good | Keep as-is |
| `file-utils.service.js` | File system utilities for finding students/exercises | ✅ Good | Keep as-is |
| `report.service.js` | Generates reports in various formats | ✅ Good | Keep as-is |
| `util.service.js` | General utility functions (parseNumRange, etc.) | ✅ Good | Keep as-is |

---

## Key Issues Identified

### 1. **CRITICAL: `test-runner.service.js` is Misleading**
- **Current name implies**: Runs tests for exercises
- **Actually does**: Executes student code/functions in a sandbox
- **Used by**: The actual test files (e.g., `01.test.js`) to run student code
- **Better name**: `code-executor.service.js` or `student-code-runner.service.js`

### 2. **`score-calc.js` Should Be a Service**
- Calculates scores - this is a service function
- Should be in `services/` directory
- Should follow naming convention: `score-calculator.service.js`

### 3. **`prompt.js` Is Vague**
- Name doesn't indicate it's for CLI interaction
- Should be in `services/` directory
- Better name: `cli-prompt.service.js` or `user-input.service.js`

### 4. **`test.service.js` Is a Facade Pattern**
- Just re-exports from other services
- Creates confusion about what's a "test" service vs actual testing
- Consider removing and updating imports directly

---

## Recommended Changes

### Phase 1: Critical Rename (Highest Priority)
```bash
# Rename the misleading test-runner service
mv src/services/test-runner.service.js src/services/code-executor.service.js
```
**Impact**: This is the most misleading name. It executes student code, not tests.

### Phase 2: Move Files to Services
```bash
# Move score calculator
mv src/score-calc.js src/services/score-calculator.service.js

# Move CLI prompt utilities  
mv src/prompt.js src/services/cli-prompt.service.js
```
**Impact**: Better organization - all services in one place.

### Phase 3: Update Imports (Required after Phase 1 & 2)
Files that need import updates:
- `src/test-runner.js` → imports from `score-calc.js`
- `src/index.js` → imports from `score-calc.js` and `prompt.js`
- `src/server.js` → imports from `test-runner.js`
- `src/services/test.service.js` → imports from `test-runner.service.js`
- All test files in `tests/*.test.js` → import from `test-runner.service.js`

### Phase 4: Optional - Remove or Rename test.service.js
**Option A**: Remove it entirely
- Update all imports to use direct imports from specific services
- Cleaner, more explicit

**Option B**: Rename to `test-helpers.service.js`
- Keep backward compatibility
- Makes purpose clearer

---

## After Refactoring - File Structure

```
src/
├── index.js                          # CLI entry point
├── server.js                         # Web server entry point  
├── test-runner.js                    # Orchestrates exercise testing
│
├── services/
│   ├── code-executor.service.js     # [RENAMED] Executes student code in sandbox
│   ├── sandbox.service.js           # VM sandbox for code execution
│   ├── mock-browser.service.js      # Browser API mocks
│   │
│   ├── test-collector.service.js    # Test result collector
│   ├── type-checker.service.js      # Type checking utilities
│   ├── test-helpers.service.js      # [OPTIONAL] Facade for test utilities
│   │
│   ├── score-calculator.service.js  # [MOVED] Score calculation
│   ├── cli-prompt.service.js        # [MOVED] Interactive CLI prompts
│   │
│   ├── file-utils.service.js        # File system utilities
│   ├── util.service.js              # General utilities
│   ├── report.service.js            # Report generation
│   │
│   └── report-generators/           # Report format generators
│
├── views/                            # Pug templates
├── public/                           # Static files
└── uploads/                          # Temporary file uploads
```

---

## Benefits of These Changes

1. **Clarity**: Names accurately reflect what files do
2. **Organization**: All services in one place
3. **Consistency**: All services follow `.service.js` naming
4. **Discoverability**: Easier to find functionality
5. **Maintenance**: Clear separation of concerns

---

## Service Definition Clarification

**What qualifies as a "service"?**
- Reusable utilities that provide specific functionality
- Not entry points (like `index.js` or `server.js`)
- Not orchestrators (like `test-runner.js` which coordinates other services)
- Examples:
  - ✅ `code-executor.service.js` - executes code
  - ✅ `score-calculator.service.js` - calculates scores
  - ✅ `cli-prompt.service.js` - handles user input
  - ❌ `test-runner.js` - orchestrates the testing process (uses services)
  - ❌ `index.js` - entry point (uses services)

---

## Implementation Priority

1. **HIGH**: Rename `test-runner.service.js` → `code-executor.service.js`
   - Most misleading name causing confusion
   
2. **MEDIUM**: Move `score-calc.js` → `services/score-calculator.service.js`
   - Improves consistency
   
3. **MEDIUM**: Move `prompt.js` → `services/cli-prompt.service.js`
   - Improves organization
   
4. **LOW**: Handle `test.service.js` facade pattern
   - Works fine as-is, but could be cleaner

