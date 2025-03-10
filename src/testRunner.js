import path from 'path'
import vm from 'vm'
import { readFileAsync } from './fileUtils.js'
import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages } from './mockBrowser.js'

// Run a single test for a student's exercise
const testExercise = async (exercisePath, expectedBehavior) => {
  try {
    const code = await readFileAsync(exercisePath, 'utf8')
    
    // Prepare results object
    const results = {
      runs: false,
      correct: false,
      errorMessage: null
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
      
      // If we get here, the code runs
      results.runs = true
      
      // Check expected behavior if available
      if (expectedBehavior && expectedBehavior.outputs) {
        const consoleOutput = getConsoleMessages()
        const alertOutput = getAlertMessages()
        
        // Combine outputs to check against expected behavior
        const allOutputs = [...consoleOutput, ...alertOutput]
        
        // Simple matching logic - can be made more sophisticated
        if (expectedBehavior.outputs.some(expected => 
            allOutputs.some(actual => actual.includes(expected)))) {
          results.correct = true
        }
      } else {
        // If no expected behavior is defined, assume it's correct if it runs
        results.correct = true
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