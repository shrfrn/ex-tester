# Server.js Refactoring Plan

## Overview
Break down `server.js` into smaller, focused functions following functional programming principles.

## Function Breakdown

### 1. Configuration Functions

#### `getCorsOptions()`
- **Purpose**: Return CORS configuration object
- **Returns**: `{ origin, methods, allowedHeaders, credentials }`
- **Location**: Top level utility function

#### `initMulter()`
- **Purpose**: Create and configure multer instance for file uploads
- **Returns**: Configured multer middleware instance
- **Logic**: 
  - Create disk storage with destination and filename handlers
  - Ensure uploads directory exists
  - Generate unique filenames with timestamp

#### `initReportRenderer(app)`
- **Purpose**: Initialize report service with Express renderer
- **Parameters**: Express app instance
- **Returns**: Promise (for initialization)
- **Logic**: Wrap app.render in Promise for report service

#### `configureApp(app, __dirname)`
- **Purpose**: Set up Express app middleware and configuration
- **Parameters**: Express app, __dirname path
- **Returns**: void
- **Logic**:
  - Set view engine (pug)
  - Set views directory
  - Apply CORS middleware
  - Serve static files (public, reports)
  - Parse JSON bodies

### 2. Request Handling Functions

#### `validateTestRequest(req)`
- **Purpose**: Validate incoming test request
- **Parameters**: Express request object
- **Returns**: `{ valid: boolean, error?: string, statusCode?: number }`
- **Logic**:
  - Check if file is uploaded
  - Check if exerciseId is provided
  - Return validation result

#### `formatStudentResult(studentName, exerciseId, results)`
- **Purpose**: Format test results into report generator format
- **Parameters**: studentName (string), exerciseId (string), results (object)
- **Returns**: Student result object with scores and testResults
- **Logic**:
  - Create student result structure
  - Calculate scores based on results
  - Return formatted object

#### `cleanupUploadedFile(filePath)`
- **Purpose**: Delete uploaded file after processing
- **Parameters**: filePath (string)
- **Returns**: void (handles errors internally)
- **Logic**: Use fs.unlink with error handling

### 3. Route Handler Functions

#### `handleTestRequest(req, res)`
- **Purpose**: Handle POST /api/test endpoint
- **Parameters**: Express request, response
- **Returns**: Promise (async)
- **Logic**:
  - Validate request
  - Extract studentName, exerciseId, filePath
  - Run exercise tests
  - Format student result
  - Generate HTML report
  - Send response
  - Cleanup file (async)

#### `handleIndex(req, res)`
- **Purpose**: Handle GET / endpoint
- **Parameters**: Express request, response
- **Returns**: void
- **Logic**: Render index view

### 4. Main Server Setup

#### `createServer()`
- **Purpose**: Main function to create and configure Express server
- **Returns**: Configured Express app
- **Logic**:
  - Create Express app
  - Get __dirname
  - Initialize report renderer
  - Configure app (middleware, CORS, static files)
  - Initialize multer
  - Set up routes
  - Return app

#### `startServer(app, port)`
- **Purpose**: Start the Express server
- **Parameters**: Express app, port number
- **Returns**: void
- **Logic**: Call app.listen with logging

## File Structure

```
src/
├── server.js                    # Main entry point - creates and starts server
├── config/
│   ├── app.config.js            # App configuration (CORS, middleware, static files)
│   └── upload.config.js         # Multer configuration for file uploads
├── handlers/
│   ├── test.handler.js          # Test route handler (POST /api/test)
│   └── index.handler.js         # Index route handler (GET /)
└── utils/
    ├── request-validator.js     # Request validation utilities
    ├── result-formatter.js      # Result formatting utilities
    └── file-cleanup.js          # File cleanup utilities
```

### Module Responsibilities

**server.js**
- Main entry point
- Creates Express app
- Initializes report renderer
- Imports and applies all configuration
- Sets up routes
- Starts server

**config/app.config.js**
- Exports: `getCorsOptions()`, `configureApp(app, __dirname)`
- CORS configuration
- Express middleware setup (static files, JSON parsing)
- View engine configuration

**config/upload.config.js**
- Exports: `initMulter()`
- Multer storage configuration
- Upload directory setup
- Filename generation

**handlers/test.handler.js**
- Exports: `handleTestRequest(req, res)`
- Main test request logic
- Orchestrates validation, testing, formatting, reporting

**handlers/index.handler.js**
- Exports: `handleIndex(req, res)`
- Simple index page rendering

**utils/request-validator.js**
- Exports: `validateTestRequest(req)`
- Request validation logic

**utils/result-formatter.js**
- Exports: `formatStudentResult(studentName, exerciseId, results)`
- Transforms test results into report format

**utils/file-cleanup.js**
- Exports: `cleanupUploadedFile(filePath)`
- File deletion with error handling

## Implementation Order

1. Extract utility functions (getCorsOptions, initMulter, cleanupUploadedFile)
2. Extract validation (validateTestRequest)
3. Extract formatting (formatStudentResult)
4. Extract initialization (initReportRenderer)
5. Extract configuration (configureApp)
6. Extract route handlers (handleTestRequest, handleIndex)
7. Refactor main server setup (createServer, startServer)
8. Update main file to use extracted functions

## Benefits

- **Separation of Concerns**: Each function has a single responsibility
- **Testability**: Functions can be tested independently
- **Readability**: Main server file becomes more declarative
- **Maintainability**: Easier to modify individual components
- **Reusability**: Functions can be reused or moved to separate modules if needed

