import express from 'express'

import { initMulter } from '../../server/config/upload.config.js'
import { runTest } from './test.controller.js'

const router = express.Router()
const upload = initMulter()

router.post('/', upload.single('file'), runTest)

export const testRoutes = router