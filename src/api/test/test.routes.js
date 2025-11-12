import express from 'express'

import { initMulter } from '../../server/config/upload.config.js'
import { handleSubmission } from './test.controller.js'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

const router = express.Router()
const upload = initMulter()

router.post('/', requireAuth, upload.single('file'), handleSubmission)

export const testRoutes = router