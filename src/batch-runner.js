import path from 'path'
import fs from 'fs'

import { findStudentFolders, getStudentExercises } from './services/file-utils.service.js'
import * as testService from './services/test.service.js'
import { generateReport } from './services/report.service.js'

export async function runBatch({ submissionsPath, exerciseNumbers, reportType = 'htmlDetailed' }) {
    try {
        const studentResults = []
        const studentFolders = await findStudentFolders(submissionsPath)

        for (const student of studentFolders) {
            console.log(`\n==> Testing Student: ${student.name} <==\n`)

            const exerciseFiles = await getStudentExercises(student.path, exerciseNumbers)
            const testResults = {}

            for (const file of exerciseFiles) {
                const exerciseId = String(parseInt(file)).padStart(2, '0')
                const filePath = path.join(student.path, file)

                if (fs.existsSync(filePath)) {
                    testResults[exerciseId] = await testService.execute(exerciseId, filePath)
                } else {
                    testResults[exerciseId] = { submitted: false }
                }
            }

            studentResults.push({
                name: student.name,
                folderPath: student.path,
                testResults,
            })
        }

        calculateAggregateScores(studentResults, exerciseNumbers.length)

        const reportsDir = path.join(process.cwd(), 'reports')
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true })
        }

        const resultsPath = path.join(process.cwd(), 'reports', 'student-results.json')
        fs.writeFileSync(resultsPath, JSON.stringify(studentResults, null, 4))

        generateReport(studentResults, reportType)
        
    } catch (error) {
        console.error('Error during batch test evaluation:', error)
    }
}

function calculateAggregateScores(studentResults, totalExercises) {
    for (const student of studentResults) {
        let submittedCount = 0
        let successfulCount = 0
        let totalScore = 0
        let totalWeight = 0

        for (const result of Object.values(student.testResults)) {
            if (result.submitted === false) continue

            submittedCount++
            if (result.success) successfulCount++

            const weight = result.weight || 1
            totalScore += (result.normalizedScore || 0) * weight
            totalWeight += weight
        }

        student.scores = {
            submissionRate: submittedCount / totalExercises,
            normalizedScore: totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0,
            submittedCount,
            totalExercises,
            successfulCount,
            successRate: submittedCount > 0 ? successfulCount / submittedCount : 0,
        }
    }
}

