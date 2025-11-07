import cors from 'cors'
import express from 'express'
import path from 'path'

import { initReportService } from '../../services/report.service.js'
import { setupAsyncLocalStorage } from '../../middlewares/setupAls.middleware.js'

import { authRoutes } from '../../api/auth/auth.routes.js'
import { testRoutes } from '../../api/test/test.routes.js'

export function initReportRenderer(app) {
    initReportService((view, options) => {
        return new Promise((resolve, reject) => {
            try {
                app.render(view, options, (err, html) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(html)
                })
            } catch (error) {
                reject(error)
            }
        })
    })
}

export function getCorsOptions() {
    return {
        origin: true,  // Allow all origins
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,  // Allow cookies to be sent with requests
    }
}

export function configureApp(app, __dirname) {
    // Set up view engine
    app.set('view engine', 'pug')
    app.set('views', path.join(__dirname, 'views'))

    // Apply CORS middleware
    app.use(cors(getCorsOptions()))

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')))
    app.use('/reports', express.static(path.join(__dirname, 'reports')))

    // Parse JSON bodies
    app.use(express.json())

    app.all('*all', setupAsyncLocalStorage)
    app.use('/api/test', testRoutes)
    app.use('/api/auth', authRoutes)
}

