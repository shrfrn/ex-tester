import path from 'path'
import vm from 'vm'
import { readFileAsync } from './fileUtils.js'
import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getCallCounts } from './mockBrowser.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

// Helper function to run Jest tests with the correct file path
const runJestTestForFile = async (exercisePath) => {
  try {
    // Set the environment variable with the student file path
    process.env.CURRENT_STUDENT_FILE_PATH = exercisePath
    
    // Determine which test to run based on the exercise file name
    const exerciseNum = path.basename(exercisePath, '.js')
    const testPath = path.join(process.cwd(), '__tests__', `${exerciseNum}.test.js`)
    
    // Run Jest test for this specific exercise
    const { stdout, stderr } = await execAsync(`npx jest ${testPath} --no-watchman --silent`)
    
    return {
      success: !stderr.includes('FAIL'),
      output: stdout
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Run a single test for a student's exercise
const testExercise = async (exercisePath, expectedBehavior) => {
  try {
    // Read the code directly from the student's file path
    const code = await readFileAsync(exercisePath, 'utf8')
    
    // Store the original file path for later use
    process.env.CURRENT_STUDENT_FILE_PATH = exercisePath
    
    // Prepare results object
    const results = {
      runs: false,
      correct: false,
      errorMessage: null,
      callCounts: null,
      exercisePath
    }
    
    // Create sandbox with mocked browser functions
    const sandbox = {
      console: { log: mockConsoleLog },
      alert: mockAlert,
      prompt: mockPrompt,
      // Add any other global browser functions that might be used
      document: {},
      window: {}
    }
    
    // Add global object references
    sandbox.global = sandbox
    sandbox.window.document = sandbox.document
    
    // Reset mocks before each test
    resetMocks()
    
    // Set up expected inputs if available
    if (expectedBehavior && expectedBehavior.inputs && expectedBehavior.inputs.length > 0) {
      setPromptResponses(expectedBehavior.inputs)
    } else {
      // Default test inputs if not specified
      setPromptResponses(['test', '123', 'yes'])
    }
    
    try {
      // Execute code in sandbox
      const script = new vm.Script(code)
      const context = vm.createContext(sandbox)
      script.runInContext(context)
      
      // Get counts of function calls
      results.callCounts = getCallCounts()
      
      // If we get here, the code runs
      results.runs = true
      
      // Evaluate based on function calls and output
      const consoleOutput = getConsoleMessages()
      const alertOutput = getAlertMessages()
      const allOutputs = [...consoleOutput, ...alertOutput]
      
      // Get input values for testing
      const [firstName, lastName] = expectedBehavior?.inputs || ['test', '123']
      
      // For Exercise 1 (full name greeting)
      if (path.basename(exercisePath).startsWith('01')) {
        const promptCalls = results.callCounts.prompt
        const alertCalls = results.callCounts.alert
        const consoleCalls = results.callCounts.consoleLog
        
        // For debugging
        console.log(`Testing ${exercisePath}:`)
        console.log(`- Prompt calls: ${promptCalls}`)
        console.log(`- Alert calls: ${alertCalls}`)
        console.log(`- Console calls: ${consoleCalls}`)
        console.log(`- Outputs: ${JSON.stringify(allOutputs)}`)
        
        if (promptCalls >= 2) {
          // Check that there is output containing both prompt responses
          const hasFullNameOutput = allOutputs.some(output => 
            output.includes(firstName) && output.includes(lastName))
          
          // Check if there's an alert or console output that has additional text (greeting)
          const hasGreeting = allOutputs.some(output => {
            const words = output.split(/\s+/).filter(word => 
              word !== firstName && word !== lastName && word.length > 0)
            return words.length > 0 && 
                   output.includes(firstName) && 
                   output.includes(lastName)
          })
          
          results.correct = hasFullNameOutput && hasGreeting
          
          if (!results.correct) {
            results.errorMessage = `Missing ${!hasFullNameOutput ? 'fullName output' : 'greeting'}`
          }
        } else {
          results.correct = false
          results.errorMessage = `Expected at least 2 prompt calls, but found ${promptCalls}`
        }
      }
      // Add similar checks for other exercises
      else if (expectedBehavior && expectedBehavior.outputs) {
        // For other exercises, use the expected behavior definition
        if (expectedBehavior.outputs.some(expected => 
            allOutputs.some(actual => actual.includes(expected)))) {
          results.correct = true
        } else {
          results.correct = false
          results.errorMessage = 'Output did not match expected values'
        }
      } else {
        // If no specific check exists and no expected behavior is defined, 
        // verify there is at least some output
        results.correct = allOutputs.length > 0
      }
    } catch (error) {
      results.errorMessage = error.message
    }
    
    return results
  } catch (error) {
    return {
      runs: false,
      correct: false,
      errorMessage: `Failed to read file: ${error.message}`
    }
  }
}

// Run tests for all exercises of a student
const testStudentExercises = async (studentFolder, exerciseFiles, assignmentRequirements, exerciseRange) => {
  const results = {}
  const [start, end] = exerciseRange
  
  for (let i = start; i <= end; i++) {
    const exerciseId = String(i).padStart(2, '0')
    const fileName = `${exerciseId}.js`
    
    if (exerciseFiles.includes(fileName)) {
      const exercisePath = path.join(studentFolder, fileName)
      const expectedBehavior = assignmentRequirements[exerciseId]
        ? assignmentRequirements[exerciseId]
        : null
      
      results[exerciseId] = await testExercise(exercisePath, expectedBehavior)
    } else {
      results[exerciseId] = { submitted: false }
    }
  }
  
  return results
}

export {
  testExercise,
  testStudentExercises
} 