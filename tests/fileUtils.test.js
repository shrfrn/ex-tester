import { stripComments } from '../src/fileUtils.js'
import fs from 'fs'
import path from 'path'

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

// Helper function to create a temporary test file
function createTestFile(content) {
  const tempDir = path.join(process.cwd(), 'temp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  
  const filePath = path.join(tempDir, `test-${Date.now()}-${Math.random().toString(36).substring(7)}.js`)
  fs.writeFileSync(filePath, content)
  return filePath
}

// Helper function to clean up test files
function cleanupTestFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`Error cleaning up test file ${filePath}:`, error)
  }
}

// Helper function to clean up temp directory
function cleanupTempDir() {
  const tempDir = path.join(process.cwd(), 'temp')
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir)
    }
  } catch (error) {
    console.error(`Error cleaning up temp directory: ${error}`)
  }
}

// Tests for stripComments
function testStripComments() {
  const testFiles = []
  
  const tests = [
    // Basic comment removal
    {
      name: 'Single line comment',
      content: 'const x = 1 // This is a comment',
      expected: 'const x = 1'
    },
    {
      name: 'Multiple single line comments',
      content: 'const x = 1 // First comment\nconst y = 2 // Second comment',
      expected: 'const x = 1\nconst y = 2'
    },
    {
      name: 'Multi-line comment',
      content: '/* This is a\nmulti-line comment */\nconst x = 1',
      expected: 'const x = 1'
    },
    
    // String preservation
    {
      name: 'Preserves single quoted strings',
      content: "const str = 'This is a string with // comment'",
      expected: "const str = 'This is a string with // comment'"
    },
    {
      name: 'Preserves double quoted strings',
      content: 'const str = "This is a string with /* comment */"',
      expected: 'const str = "This is a string with /* comment */"'
    },
    {
      name: 'Preserves template literals',
      content: 'const str = `This is a template with // comment`',
      expected: 'const str = `This is a template with // comment`'
    },
    
    // Complex cases
    {
      name: 'Mixed comments and strings',
      content: `
        // Single line comment
        const str1 = 'String with // comment'
        /* Multi-line
           comment */
        const str2 = "String with /* comment */"
        const str3 = \`Template with // comment\`
      `,
      expected: "const str1 = 'String with // comment'\nconst str2 = \"String with /* comment */\"\nconst str3 = \`Template with // comment\`"
    },
    {
      name: 'Nested comments in strings',
      content: `
        const str1 = 'String with /* nested comment */'
        const str2 = "String with // nested comment"
        const str3 = \`Template with /* nested comment */\`
      `,
      expected: "const str1 = 'String with /* nested comment */'\nconst str2 = \"String with // nested comment\"\nconst str3 = \`Template with /* nested comment */\`"
    },
    {
      name: 'Empty lines after comment removal',
      content: `
        // Comment 1
        const x = 1
        
        /* Comment 2 */
        const y = 2
        
        // Comment 3
        const z = 3
      `,
      expected: "const x = 1\nconst y = 2\nconst z = 3"
    },
    
    // Edge cases
    {
      name: 'Empty file',
      content: '',
      expected: ''
    },
    {
      name: 'File with only comments',
      content: '// Comment 1\n/* Comment 2 */',
      expected: ''
    },
    {
      name: 'File with no comments',
      content: 'const x = 1\nconst y = 2',
      expected: 'const x = 1\nconst y = 2'
    }
  ]
  
  // Run tests and get results
  const results = tests.map(test => {
    const filePath = createTestFile(test.content)
    testFiles.push(filePath)
    return {
      name: test.name,
      actual: stripComments(filePath),
      expected: test.expected
    }
  })
  
  // Clean up test files
  testFiles.forEach(cleanupTestFile)
  
  return runTests('Strip Comments', results)
}

// Run all tests
function runAllTests() {
  const stripCommentsResults = testStripComments()
  
  const totalTests = stripCommentsResults.passCount + stripCommentsResults.failCount
  const totalPassed = stripCommentsResults.passCount
  
  console.log('📊 TEST SUMMARY 📊')
  console.log(`Total: ${totalTests} tests, ${totalPassed} passed, ${totalTests - totalPassed} failed`)
  
  if (totalTests === totalPassed) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('❌ Some tests failed')
  }

  // Clean up temp directory after all tests
  cleanupTempDir()
}

// Execute tests
runAllTests() 