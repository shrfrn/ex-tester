import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { configureApp, initReportRenderer } from './server/config/app.config.js'
import { initMulter } from './server/config/upload.config.js'
import { handleTestRequest } from './server/endpoints/test.endpoint.js'
import { handleIndex } from './server/endpoints/index.endpoint.js'

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Express app
const app = express()
const port = process.env.PORT || 3000

// Initialize report renderer
initReportRenderer(app)

// Configure app (CORS, middleware, static files, view engine)
configureApp(app, __dirname)

// Initialize multer for file uploads
const upload = initMulter()

// Set up routes
app.post('/api/test', upload.single('file'), handleTestRequest)
app.get('/', handleIndex)

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
