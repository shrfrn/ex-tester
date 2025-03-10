import fs from 'fs'
import path from 'path'

// Analyze code quality for a student's exercise
const analyzeCodeQuality = async (filePath) => {
  try {
    const code = fs.readFileSync(filePath, 'utf8')
    
    // Define metrics
    const metrics = {
      naming: 0,
      indentation: 0,
      legibility: 0,
      logic: 0,
      dryness: 0,
      total: 0
    }
    
    // Check naming conventions
    metrics.naming = evaluateNaming(code)
    
    // Check indentation
    metrics.indentation = evaluateIndentation(code)
    
    // Check code legibility
    metrics.legibility = evaluateLegibility(code)
    
    // Check logic structure
    metrics.logic = evaluateLogic(code)
    
    // Check DRY principles
    metrics.dryness = evaluateDryness(code)
    
    // Calculate total score (average of all metrics)
    metrics.total = calculateAverageScore(metrics)
    
    return metrics
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error)
    return {
      naming: 0,
      indentation: 0,
      legibility: 0, 
      logic: 0,
      dryness: 0,
      total: 0
    }
  }
}

// Evaluate variable and function naming (camelCase, descriptive)
const evaluateNaming = (code) => {
  let score = 5
  
  // Check for non-descriptive variable names
  const poorNames = ['a', 'b', 'c', 'x', 'y', 'z', 'foo', 'bar', 'temp', 'tmp']
  poorNames.forEach(name => {
    const regex = new RegExp(`\\b(let|const|var)\\s+${name}\\b`, 'g')
    if (regex.test(code)) {
      score -= 0.5
    }
  })
  
  // Check for non-camelCase variable names
  const nonCamelCaseRegex = /\b(let|const|var)\s+([a-z][a-z0-9]*_[a-z0-9]+|\b[A-Z][a-z0-9]*[A-Z])/g
  const nonCamelCaseMatches = code.match(nonCamelCaseRegex) || []
  score -= nonCamelCaseMatches.length * 0.5
  
  // Ensure score is between 1-5
  return Math.max(1, Math.min(5, score))
}

// Evaluate code indentation consistency
const evaluateIndentation = (code) => {
  let score = 5
  
  // Check for consistent indentation using spaces
  const lines = code.split('\n')
  const indentSizes = []
  
  for (const line of lines) {
    const trimmedLine = line.trimLeft()
    if (trimmedLine && trimmedLine !== line) {
      const indentSize = line.length - trimmedLine.length
      indentSizes.push(indentSize)
    }
  }
  
  // Check consistency (most common indent size)
  if (indentSizes.length > 0) {
    const counts = {}
    indentSizes.forEach(size => {
      counts[size] = (counts[size] || 0) + 1
    })
    
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    
    // Count inconsistencies
    const inconsistencies = indentSizes.filter(size => size % mostCommon !== 0).length
    score -= inconsistencies * 0.5
  }
  
  return Math.max(1, Math.min(5, score))
}

// Evaluate code legibility (comments, spacing, line length)
const evaluateLegibility = (code) => {
  let score = 5
  
  // Check for comments
  const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g
  const comments = code.match(commentRegex) || []
  if (comments.length === 0) {
    score -= 1
  }
  
  // Check for excessively long lines
  const lines = code.split('\n')
  const longLines = lines.filter(line => line.length > 80).length
  score -= longLines * 0.2
  
  // Check for spacing around operators
  const poorSpacingRegex = /([a-zA-Z0-9])([\+\-\*\/\=])([a-zA-Z0-9])/g
  const poorSpacingMatches = code.match(poorSpacingRegex) || []
  score -= poorSpacingMatches.length * 0.2
  
  return Math.max(1, Math.min(5, score))
}

// Evaluate logic structure (complexity, nesting)
const evaluateLogic = (code) => {
  let score = 5
  
  // Check for deep nesting
  const lines = code.split('\n')
  let maxIndent = 0
  let currentIndent = 0
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Count opening braces/brackets
    const openBraces = (trimmedLine.match(/{/g) || []).length
    const closeBraces = (trimmedLine.match(/}/g) || []).length
    
    currentIndent += openBraces - closeBraces
    maxIndent = Math.max(maxIndent, currentIndent)
  }
  
  // Penalize for deep nesting
  if (maxIndent > 3) {
    score -= (maxIndent - 3)
  }
  
  // Check for overly complex conditionals
  const complexConditionalsRegex = /if\s*\(.*&&.*&&|if\s*\(.*\|\|.*\|\|/g
  const complexConditionals = code.match(complexConditionalsRegex) || []
  score -= complexConditionals.length * 0.5
  
  return Math.max(1, Math.min(5, score))
}

// Evaluate adherence to DRY principles
const evaluateDryness = (code) => {
  let score = 5
  
  // Look for repeated code blocks (simplified approach)
  const lines = code.split('\n')
  const normalizedLines = lines.map(line => line.trim()).filter(line => line)
  
  const duplicateBlocks = {}
  
  // Check for blocks of 3+ identical lines
  for (let i = 0; i < normalizedLines.length - 2; i++) {
    const block = normalizedLines.slice(i, i + 3).join('\n')
    duplicateBlocks[block] = (duplicateBlocks[block] || 0) + 1
  }
  
  // Count blocks that appear more than once
  const repeatedBlocks = Object.values(duplicateBlocks).filter(count => count > 1).length
  score -= repeatedBlocks
  
  return Math.max(1, Math.min(5, score))
}

// Calculate average score across all metrics
const calculateAverageScore = (metrics) => {
  const { naming, indentation, legibility, logic, dryness } = metrics
  return Math.round(((naming + indentation + legibility + logic + dryness) / 5) * 10) / 10
}

// Analyze code quality for all exercises
const analyzeStudentCodeQuality = async (studentFolder, exerciseFiles) => {
  const qualityResults = {}
  
  for (const file of exerciseFiles) {
    const filePath = path.join(studentFolder, file)
    const exerciseId = path.basename(file, '.js')
    qualityResults[exerciseId] = await analyzeCodeQuality(filePath)
  }
  
  // Calculate overall score
  const scores = Object.values(qualityResults).map(result => result.total)
  const averageScore = scores.length > 0 
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : 0
  
  return {
    exercises: qualityResults,
    overallScore: averageScore
  }
}

export {
  analyzeCodeQuality,
  analyzeStudentCodeQuality
} 