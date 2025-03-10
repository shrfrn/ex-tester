# Student Assignment Test Suite

A test suite for evaluating JavaScript student assignments.

## Features

- Automatically tests student assignment submissions
- Mocks browser functions (prompt, alert, console.log) for Node.js testing
- Evaluates code quality based on naming, indentation, legibility, logic, and DRY principles
- Generates a comprehensive markdown report with student rankings

## Installation

```bash
npm install
```

## Usage

1. Run the test suite:
   ```bash
   npm start
   ```

2. When prompted:
   - Enter the path to the student submissions folder
   - Specify the range of exercises to test (e.g., 1-10)

3. The system will:
   - Parse assignment requirements
   - Test each student's code for execution and correctness
   - Analyze code quality
   - Generate a categorized report

## Report Format

The generated report will classify students into 5 categories (5★ to 1★) and include the following metrics:
- Name
- Exercises submitted
- Percentage of exercises that run without errors
- Percentage of exercises that perform as requested
- Code quality grade
- Link to the student's Exercise-Runner folder

## Project Structure

- `src/index.js` - Main entry point
- `src/fileUtils.js` - File system operations
- `src/testRunner.js` - Test execution logic
- `src/mockBrowser.js` - Browser function mocks
- `src/codeAnalyzer.js` - Code quality analysis
- `src/reportGenerator.js` - Report generation
- `src/utils.js` - Helper functions 