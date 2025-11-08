import express from 'express'

import { initMulter } from '../../server/config/upload.config.js'
import { runTest } from './test.controller.js'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

const router = express.Router()
const upload = initMulter()

router.post('/', requireAuth, upload.single('file'), runTest)

export const testRoutes = router