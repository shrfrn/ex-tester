import fs from 'fs'
import path from 'path'

import { promisify } from 'util'
import { glob } from 'glob'

const readDirAsync = promisify(fs.readdir)

// Find all student submission folders using glob pattern
export async function findStudentFolders(globPattern) {
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
		const studentDistanceFromEnd = reversedPattern.findIndex(part => part.includes('{student:'))

		return matches.map(exercisePath => {
			// Split the path from the end and use same distance as pattern
			const reversedPath = exercisePath.split(path.sep).reverse()
			const studentName = reversedPath[studentDistanceFromEnd] || ''

			return {
				name: studentName,
				path: exercisePath,
			}
		})
	} catch (error) {
		console.error(`Error searching for student folders: ${error.message}`)
		throw error
	}
}

// Get list of exercise files for a student
export async function getStudentExercises(studentFolder, exerciseNumbers) {
	try {
		const files = await readDirAsync(studentFolder)
		return files
			.filter(file => /^\d+\.js$/.test(file) && exerciseNumbers.includes(parseInt(file)))
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

export function stripComments(filePath) {
	try {
		const code = fs.readFileSync(filePath, 'utf8')

		// Remove single-line and multi-line comments
		// This regex handles:
		// 1. Single-line comments: // comment
		// 2. Multi-line comments: /* comment */
		// But preserves comments within strings
        const commentPattern = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|('(?:\\[\s\S]|[^\\'])*')|("(?:\\[\s\S]|[^\\"])*")|(`(?:\\[\s\S]|[^\\`])*`)/gm
		const strippedCode = code.replace(commentPattern, (match, singleLineComment, multiLineComment, singleQuote, doubleQuote, template) => {
			// Keep string literals
			if (singleQuote || doubleQuote || template) return match

			// Remove comments
			return ''
		})

		return strippedCode
	} catch (error) {
		console.error(`Error reading or processing file ${filePath}:`, error)
		return ''
	}
}