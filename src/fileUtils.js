import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import MarkdownIt from 'markdown-it'

const readFileAsync = promisify(fs.readFile)
const readDirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)

// Parse assignment markdown files to extract requirements
const parseAssignmentFiles = async (assignmentPath) => {
  const md = new MarkdownIt()
  const files = await readDirAsync(assignmentPath)
  
  const assignments = []
  
  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(assignmentPath, file)
      const content = await readFileAsync(filePath, 'utf8')
      
      // Parse markdown to extract assignment details
      // This is a simplified version - actual implementation would need to
      // parse the markdown structure to extract requirements
      const renderedContent = md.render(content)
      
      assignments.push({
        id: path.basename(file, '.md'),
        content: renderedContent,
        // Extract expected behavior for tests
        expectedBehavior: extractExpectedBehavior(content)
      })
    }
  }
  
  return assignments
}

// Extract expected behavior from markdown content
// This would need to be customized based on the markdown structure
const extractExpectedBehavior = (markdownContent) => {
  // This is placeholder logic - actual implementation would depend on
  // how the assignments are structured in markdown
  const behaviorsMap = {}
  
  // Example extraction logic
  const lines = markdownContent.split('\n')
  let currentExercise = null
  
  for (const line of lines) {
    // Detect exercise number from headings or specific patterns
    const exerciseMatch = line.match(/Exercise\s+(\d+)/i)
    if (exerciseMatch) {
      currentExercise = exerciseMatch[1].padStart(2, '0')
      behaviorsMap[currentExercise] = { inputs: [], outputs: [] }
    }
    
    // Extract example inputs/outputs
    if (currentExercise && line.includes('Example:')) {
      // Simple pattern matching - would need refinement
      const inputMatch = line.match(/Input:\s*(.+)/)
      const outputMatch = line.match(/Output:\s*(.+)/)
      
      if (inputMatch) {
        behaviorsMap[currentExercise].inputs.push(inputMatch[1])
      }
      
      if (outputMatch) {
        behaviorsMap[currentExercise].outputs.push(outputMatch[1])
      }
    }
  }
  
  return behaviorsMap
}

// Find all student submission folders
const findStudentFolders = async (submissionPath) => {
  try {
    console.log(`Accessing directory: "${submissionPath}"`)
    
    // Check if the directory exists and is accessible
    try {
      await statAsync(submissionPath)
    } catch (error) {
      console.error(`Error accessing submission path: ${submissionPath}`)
      console.error(`Error details: ${error.message}`)
      throw new Error(`Cannot access the submission directory: ${submissionPath}. Please check the path and try again.`)
    }
    
    const folders = await readDirAsync(submissionPath)
    const studentFolders = []
    
    for (const folder of folders) {
      const folderPath = path.join(submissionPath, folder)
      
      try {
        const stats = await statAsync(folderPath)
        
        if (stats.isDirectory()) {
          const exerciseFolder = path.join(folderPath, 'Day1-10-ExRunner', 'Exercise-Runner', 'ex')
          
          try {
            await statAsync(exerciseFolder)
            studentFolders.push({
              name: folder,
              path: exerciseFolder
            })
          } catch (error) {
            // Exercise folder doesn't exist for this student
            console.log(`No exercise folder found for student: ${folder}`)
          }
        }
      } catch (error) {
        console.log(`Error accessing student folder: ${folderPath}`)
      }
    }
    
    return studentFolders
  } catch (error) {
    console.error(`Error searching for student folders: ${error.message}`)
    throw error
  }
}

// Get list of exercise files for a student
const getStudentExercises = async (studentFolder) => {
  try {
    const files = await readDirAsync(studentFolder)
    return files
      .filter(file => /^\d+\.js$/.test(file))
      .sort((a, b) => {
        const numA = parseInt(a)
        const numB = parseInt(b)
        return numA - numB
      })
  } catch (error) {
    console.error(`Error reading exercises for student folder: ${studentFolder}`, error)
    return []
  }
}

export {
  parseAssignmentFiles,
  findStudentFolders,
  getStudentExercises,
  readFileAsync
} 