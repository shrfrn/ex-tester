import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { runExerciseTests } from './src/core.js'
import { generateReport } from './src/reportGenerator.js'

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Express app
const app = express()
const port = process.env.PORT || 3000

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Use a timestamp to ensure unique filenames
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')))
app.use('/detailed-reports', express.static(path.join(__dirname, 'detailed-reports')))

// Parse JSON bodies
app.use(express.json())

// API endpoint for testing a single exercise
app.post('/api/test', upload.single('file'), async (req, res) => {
    try {
        // Validate request
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const exerciseId = req.body.exerciseId
        if (!exerciseId) {
            return res.status(400).json({ error: 'Exercise ID is required' })
        }

        const studentName = req.body.studentName || 'Anonymous'

        // Get the uploaded file path
        const filePath = req.file.path

        // Run the test
        const { results } = await runExerciseTests({ exerciseId, filePath })

        // Create a student result object in the format expected by the report generator
        const studentResult = {
            name: studentName,
            folderPath: '',
            testResults: {
                [exerciseId]: results
            },
            scores: {
                submissionRate: 1,
                exerciseScore: results.score || 0,
                normalizedScore: results.score || 0,
                submittedCount: 1,
                totalExercises: 1,
                successfulCount: results.success ? 1 : 0,
                successRate: results.success ? 1 : 0
            }
        }

        // Generate HTML report
        const htmlReport = generateReport([studentResult], 'htmlDetailed', {
            saveToFile: false,
            isSingleExercise: true
        })

        // Return the results
        res.send(htmlReport)

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting temporary file:', err)
        })
    } catch (error) {
        console.error('Error processing test:', error)
        res.status(500).json({ error: 'Failed to process test', details: error.message })
    }
})

// Simple HTML form for testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})