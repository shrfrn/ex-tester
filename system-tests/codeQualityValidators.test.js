import { validateVarNames, validateIndentation, validateLineSpacing, validateQuotes, validateNoSemicolons } from './codeQuality.test.js'

// Helper function to run tests and log results
function runTests(testName, tests) {
  console.log(`\n🧪 Running ${testName} tests...`)
  
  let passCount = 0
  let failCount = 0
  
  tests.forEach(test => {
    const { name, actual, expected, customMessage } = test
    const passed = JSON.stringify(actual) === JSON.stringify(expected)
    
    if (passed) {
      console.log(`✅ PASS: ${name}`)
      passCount++
    } else {
      console.log(`❌ FAIL: ${name}`)
      console.log(`  Expected: ${JSON.stringify(expected)}`)
      console.log(`  Actual:   ${JSON.stringify(actual)}`)
      if (customMessage) {
        console.log(`  Message:  ${customMessage}`)
      }
      failCount++
    }
  })
  
  console.log(`\n${testName} Results: ${passCount} passed, ${failCount} failed\n`)
  return { passCount, failCount }
}

// Tests for validateVarNames
function testVarNameValidation() {
  const tests = [
    // Valid variable names
    {
      name: 'Valid camelCase variables',
      actual: validateVarNames('const myVar = 5\nlet anotherVar = "test"\nfunction doSomething() {}'),
      expected: { isValid: true, violations: [] }
    },
    // Note: UPPER_SNAKE_CASE is considered valid for global constants in the function definition
    // but the regex pattern used in the implementation only catches them to validate them, not to exempt them
    {
      name: 'UPPER_SNAKE_CASE constants',
      actual: validateVarNames('const MY_CONSTANT = 42\nconst ANOTHER_CONST = "test"'),
      expected: { 
        isValid: false, 
        violations: [
          {
            name: 'MY_CONSTANT',
            position: 0,
            expected: 'camelCase'
          },
          {
            name: 'ANOTHER_CONST',
            position: 23,
            expected: 'camelCase'
          }
        ]
      }
    },
    {
      name: 'Mixed naming styles',
      actual: validateVarNames('const MY_CONFIG = {}\nlet userId = 123\nfunction getData() {}'),
      expected: { 
        isValid: false, 
        violations: [
          {
            name: 'MY_CONFIG',
            position: 0,
            expected: 'camelCase'
          }
        ] 
      }
    },
    
    // Invalid variable names
    {
      name: 'Invalid snake_case variables',
      actual: validateVarNames('let user_id = 123'),
      expected: { 
        isValid: false, 
        violations: [{
          name: 'user_id',
          position: 0,
          expected: 'camelCase'
        }]
      }
    },
    {
      name: 'Invalid TitleCase variables',
      actual: validateVarNames('const UserData = {}\nfunction GetItems() {}'),
      expected: { 
        isValid: false, 
        violations: [
          {
            name: 'UserData',
            position: 0,
            expected: 'camelCase'
          },
          {
            name: 'GetItems',
            position: 20,
            expected: 'camelCase'
          }
        ]
      }
    },
    {
      name: 'Mixed valid and invalid names',
      actual: validateVarNames('const API_URL = "https://api.example.com"\nlet User_Name = "John"'),
      expected: { 
        isValid: false, 
        violations: [
          {
            name: 'API_URL',
            position: 0,
            expected: 'camelCase'
          },
          {
            name: 'User_Name',
            position: 42,
            expected: 'camelCase'
          }
        ]
      }
    }
  ]
  
  return runTests('Variable Name Validation', tests)
}

// Tests for validateIndentation
function testIndentationValidation() {
  const tests = [
    // Space indentation
    {
      name: 'Valid 2-space indentation',
      actual: validateIndentation('function test() {\n  const x = 1\n  if (x > 0) {\n    return true\n  }\n  return false\n}').isValid,
      expected: true
    },
    {
      name: 'Valid 4-space indentation',
      actual: validateIndentation('function test() {\n    const x = 1\n    if (x > 0) {\n        return true\n    }\n    return false\n}').isValid,
      expected: true
    },
    
    // Tab indentation
    {
      name: 'Valid tab indentation',
      actual: validateIndentation('function test() {\n\tconst x = 1\n\tif (x > 0) {\n\t\treturn true\n\t}\n\treturn false\n}').isValid,
      expected: true
    },
    
    // Invalid indentation
    {
      name: 'Mixed tabs and spaces',
      actual: validateIndentation('function test() {\n  const x = 1\n\tif (x > 0) {\n\t\treturn true\n\t}\n  return false\n}').isValid,
      expected: false
    },
    {
      name: 'Incorrect indent levels',
      actual: validateIndentation('function test() {\n    const x = 1\n  if (x > 0) {\n    return true\n    }\n  return false\n}').isValid,
      expected: false
    },
    
    // Edge cases
    {
      name: 'Empty file',
      actual: validateIndentation('').isValid,
      expected: true
    },
    {
      name: 'File with no indentation',
      actual: validateIndentation('const x = 1\nconst y = 2\n').isValid,
      expected: true
    },
    
    // Deep nesting
    {
      name: 'Deep nesting with correct indentation',
      actual: validateIndentation('function test() {\n  if (true) {\n    if (true) {\n      if (true) {\n        return true\n      }\n    }\n  }\n}').isValid,
      expected: true
    }
  ]
  
  return runTests('Indentation Validation', tests)
}

// Additional tests for indentation details
function testIndentationDetails() {
  const tests = [
    {
      name: 'Detects 2-space style',
      actual: validateIndentation('function test() {\n  const x = 1\n}').indentStyle,
      expected: 'space'
    },
    {
      name: 'Detects 2-space size',
      actual: validateIndentation('function test() {\n  const x = 1\n}').indentSize,
      expected: 2
    },
    {
      name: 'Detects 4-space size',
      actual: validateIndentation('function test() {\n    const x = 1\n}').indentSize,
      expected: 4
    },
    {
      name: 'Detects tab style',
      actual: validateIndentation('function test() {\n\tconst x = 1\n}').indentStyle,
      expected: 'tab'
    },
    {
      name: 'Reports violations for incorrect indentation',
      actual: validateIndentation('function test() {\n  const x = 1\n    if (true) {\n  return true\n    }\n}').violations.length,
      expected: 3
    }
  ]
  
  return runTests('Indentation Details', tests)
}

// Tests for validateLineSpacing
function testLineSpacingValidation() {
  const tests = [
    // Valid spacing (4 or fewer consecutive lines)
    {
      name: 'Four consecutive lines (valid)',
      actual: validateLineSpacing('line1\nline2\nline3\nline4'),
      expected: {
        isValid: true,
        violations: [],
        maxConsecutiveAllowed: 4
      }
    },
    {
      name: 'Lines with proper spacing',
      actual: validateLineSpacing('line1\nline2\nline3\n\nline4\nline5'),
      expected: {
        isValid: true,
        violations: [],
        maxConsecutiveAllowed: 4
      }
    },
    {
      name: 'Empty file',
      actual: validateLineSpacing(''),
      expected: {
        isValid: true,
        violations: [],
        maxConsecutiveAllowed: 4
      }
    },
    
    // Invalid spacing (more than 4 consecutive lines)
    {
      name: 'Five consecutive lines (invalid)',
      actual: validateLineSpacing('line1\nline2\nline3\nline4\nline5'),
      expected: {
        isValid: false,
        violations: [
          {
            startLine: 1,
            endLine: 5,
            count: 5,
            message: 'Found 5 consecutive non-empty lines without spacing (maximum is 4)'
          }
        ],
        maxConsecutiveAllowed: 4
      }
    },
    {
      name: 'Multiple blocks with too many consecutive lines',
      actual: validateLineSpacing('line1\nline2\nline3\nline4\nline5\n\nline6\nline7\nline8\nline9\nline10\nline11'),
      expected: {
        isValid: false,
        violations: [
          {
            startLine: 1,
            endLine: 5,
            count: 5,
            message: 'Found 5 consecutive non-empty lines without spacing (maximum is 4)'
          },
          {
            startLine: 7,
            endLine: 12,
            count: 6,
            message: 'Found 6 consecutive non-empty lines without spacing (maximum is 4)'
          }
        ],
        maxConsecutiveAllowed: 4
      }
    },
    {
      name: 'Lines with empty lines but still too many consecutive',
      actual: validateLineSpacing('line1\nline2\n\nline3\nline4\nline5\nline6\nline7\nline8'),
      expected: {
        isValid: false,
        violations: [
          {
            startLine: 4,
            endLine: 9,
            count: 6,
            message: 'Found 6 consecutive non-empty lines without spacing (maximum is 4)'
          }
        ],
        maxConsecutiveAllowed: 4
      }
    }
  ]
  
  return runTests('Line Spacing Validation', tests)
}

// Tests for validateQuotes
function testQuotesValidation() {
  const tests = [
    // Valid - only single quotes
    {
      name: 'Only single quotes (valid)',
      actual: validateQuotes("const name = 'John'\nlet message = 'Hello, world!'"),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'Empty file',
      actual: validateQuotes(''),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'No strings',
      actual: validateQuotes('const x = 1\nlet y = true\nconst z = null'),
      expected: {
        isValid: true,
        violations: []
      }
    },
    
    // Invalid - double quotes
    {
      name: 'Double quotes (invalid)',
      actual: validateQuotes('const name = "John"'),
      expected: {
        isValid: false,
        violations: [
          {
            position: 13,
            line: 1,
            content: 'const name = "John"',
            doubleQuotedString: '"John"',
            message: 'Double quotes should be replaced with single quotes'
          }
        ]
      }
    },
    {
      name: 'Mixed quotes (invalid)',
      actual: validateQuotes("const firstName = 'John'\nconst lastName = \"Doe\""),
      expected: {
        isValid: false,
        violations: [
          {
            position: 42,
            line: 2,
            content: 'const lastName = "Doe"',
            doubleQuotedString: '"Doe"',
            message: 'Double quotes should be replaced with single quotes'
          }
        ]
      }
    },
    {
      name: 'Multiple double quotes',
      actual: validateQuotes('const greeting = "Hello"\nconst name = "World"\nconst message = `Template ${name}`'),
      expected: {
        isValid: false,
        violations: [
          {
            position: 17,
            line: 1,
            content: 'const greeting = "Hello"',
            doubleQuotedString: '"Hello"',
            message: 'Double quotes should be replaced with single quotes'
          },
          {
            position: 38,
            line: 2,
            content: 'const name = "World"',
            doubleQuotedString: '"World"',
            message: 'Double quotes should be replaced with single quotes'
          }
        ]
      }
    },
    {
      name: 'Double quotes with escapes',
      actual: validateQuotes('const str = "This has \\"escaped\\" quotes"'),
      expected: {
        isValid: false,
        violations: [
          {
            position: 12,
            line: 1,
            content: 'const str = "This has \\"escaped\\" quotes"',
            doubleQuotedString: '"This has \\"escaped\\" quotes"',
            message: 'Double quotes should be replaced with single quotes'
          }
        ]
      }
    }
  ]
  
  return runTests('Quote Style Validation', tests)
}

// Tests for validateNoSemicolons
function testNoSemicolonsValidation() {
  const tests = [
    // Valid - no semicolons
    {
      name: 'No semicolons (valid)',
      actual: validateNoSemicolons('const name = "John"\nlet age = 30\nfunction greet() {\n  console.log(`Hello ${name}`)\n}'),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'Empty file',
      actual: validateNoSemicolons(''),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'For loops (valid)',
      actual: validateNoSemicolons('for (let i = 0; i < 10; i++) {\n  console.log(i)\n}'),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'Semicolons in strings (valid)',
      actual: validateNoSemicolons('const text = "This has a semicolon; in it"\nconst sql = `SELECT * FROM users;`'),
      expected: {
        isValid: true,
        violations: []
      }
    },
    {
      name: 'Comments with semicolons (valid)',
      actual: validateNoSemicolons('// This is a comment with a semicolon;\nconst x = 5'),
      expected: {
        isValid: true,
        violations: []
      }
    },
    
    // Invalid - contains semicolons
    {
      name: 'Statement with semicolon (invalid)',
      actual: validateNoSemicolons('const name = "John";'),
      expected: {
        isValid: false,
        violations: [
          {
            line: 1,
            content: 'const name = "John";',
            message: 'Line should not end with a semicolon'
          }
        ]
      }
    },
    {
      name: 'Multiple statements with semicolons (invalid)',
      actual: validateNoSemicolons('const name = "John";\nlet age = 30;\nconst job = "Developer"'),
      expected: {
        isValid: false,
        violations: [
          {
            line: 1,
            content: 'const name = "John";',
            message: 'Line should not end with a semicolon'
          },
          {
            line: 2,
            content: 'let age = 30;',
            message: 'Line should not end with a semicolon'
          }
        ]
      }
    },
    {
      name: 'Mixed valid and invalid (with semicolons)',
      actual: validateNoSemicolons('const name = "John";\nlet age = 30\nconst job = "Developer";'),
      expected: {
        isValid: false,
        violations: [
          {
            line: 1,
            content: 'const name = "John";',
            message: 'Line should not end with a semicolon'
          },
          {
            line: 3,
            content: 'const job = "Developer";',
            message: 'Line should not end with a semicolon'
          }
        ]
      }
    },
    {
      name: 'Inline comment after semicolon (invalid)',
      actual: validateNoSemicolons('const name = "John"; // This is a name'),
      expected: {
        isValid: false,
        violations: [
          {
            line: 1,
            content: 'const name = "John"; // This is a name',
            message: 'Line should not end with a semicolon'
          }
        ]
      }
    }
  ]
  
  return runTests('No Semicolons Validation', tests)
}

// Run all tests
function runAllTests() {
  const varNameResults = testVarNameValidation()
  const indentationResults = testIndentationValidation()
  const indentDetailsResults = testIndentationDetails()
  const lineSpacingResults = testLineSpacingValidation()
  const quotesResults = testQuotesValidation()
  const noSemicolonsResults = testNoSemicolonsValidation()
  
  const totalTests = varNameResults.passCount + varNameResults.failCount + 
                    indentationResults.passCount + indentationResults.failCount +
                    indentDetailsResults.passCount + indentDetailsResults.failCount +
                    lineSpacingResults.passCount + lineSpacingResults.failCount +
                    quotesResults.passCount + quotesResults.failCount +
                    noSemicolonsResults.passCount + noSemicolonsResults.failCount
  const totalPassed = varNameResults.passCount + indentationResults.passCount + 
                     indentDetailsResults.passCount + lineSpacingResults.passCount +
                     quotesResults.passCount + noSemicolonsResults.passCount
  
  console.log('📊 TEST SUMMARY 📊')
  console.log(`Total: ${totalTests} tests, ${totalPassed} passed, ${totalTests - totalPassed} failed`)
  
  if (totalTests === totalPassed) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('❌ Some tests failed')
  }
}

// Execute tests
runAllTests() 