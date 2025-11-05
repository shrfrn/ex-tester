export function validateTestRequest(req) {
    if (!req.file) {
        return {
            valid: false,
            error: 'No file uploaded',
            statusCode: 400,
        }
    }

    const exerciseId = req.body.exerciseId

    if (!exerciseId) {
        return {
            valid: false,
            error: 'Exercise ID is required',
            statusCode: 400,
        }
    }

    return {
        valid: true,
    }
}

