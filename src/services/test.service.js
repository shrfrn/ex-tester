import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { validateCodeQuality } from '../validators/code-quality.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function execute(exerciseId, filePath) {
    const formattedId = String(parseInt(exerciseId)).padStart(2, '0')
    const testFilePath = path.join(__dirname, '../exercise-tests', `${formattedId}.test.js`)
    
    console.log('Running test:', testFilePath)
    
    try {
        const { test } = await import(`file://${testFilePath}`)
        const result = test(filePath)
        
        // Don't overwrite studentCode - test already includes it
        // result.studentCode = fs.readFileSync(filePath, 'utf8')
        
        const codeQuality = validateCodeQuality(filePath)
        result.codeQuality = codeQuality
        
        if (typeof result.score === 'number' && typeof result.maxScore === 'number') {
            result.score = Math.min(result.score, result.maxScore)
            
            const baseScore = Math.round((result.score / result.maxScore) * 100)
            const qualityFactor = (100 + codeQuality.score) / 100
            result.normalizedScore = Math.max(0, Math.min(100, 
                Math.round(baseScore * qualityFactor)
            ))
        }
        
        return result
        
    } catch (error) {
        console.error(`Error running test ${formattedId}:`, error)
        
        return {
            submitted: true,
            success: false,
            error: error.message,
            normalizedScore: 0,
            codeQuality: { score: 0, results: [] }
        }
    }
}