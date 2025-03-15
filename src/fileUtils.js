import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import MarkdownIt from 'markdown-it'
import { glob } from 'glob'

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

// Find all student submission folders using glob pattern
async function findStudentFolders(globPattern) {
  try {
    console.log(`Searching with pattern: "${globPattern}"`)
    
    // Extract the named group pattern for student name
    const studentNamePattern = globPattern.match(/\{student:([^}]+)\}/)
    if (!studentNamePattern) {
      throw new Error('Glob pattern must include a named group for student name like "{student:*}"')
    }
    
    // Replace the named group with a regular glob pattern for matching
    const searchPattern = globPattern.replace(/\{student:([^}]+)\}/, '**')
    const matches = await glob(searchPattern, { absolute: true })
    
    // Find how far the student name is from the end of the pattern
    const reversedPattern = globPattern.split(path.sep).reverse()
    const studentDistanceFromEnd = reversedPattern.findIndex(part => 
      part.includes('{student:'))
    
    return matches.map(exercisePath => {
      // Split the path from the end and use same distance as pattern
      const reversedPath = exercisePath.split(path.sep).reverse()
      const studentName = reversedPath[studentDistanceFromEnd] || ''
      
      return {
        name: studentName,
        path: exercisePath
      }
    })
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