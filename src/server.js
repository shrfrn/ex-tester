import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import { configureApp, initReportRenderer } from './server/config/app.config.js'
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

// Set up routes
app.get('/', handleIndex)

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
