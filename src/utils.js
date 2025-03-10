// Helper function to print formatted messages
const printInfo = (message) => {
  console.log(`[INFO] ${message}`)
}

// Helper function to print formatted error messages
const printError = (message) => {
  console.error(`[ERROR] ${message}`)
}

// Helper function to print formatted success messages
const printSuccess = (message) => {
  console.log(`[SUCCESS] ${message}`)
}

// Helper function to sanitize student name for file paths
const sanitizeName = (name) => {
  return name.replace(/[^a-zA-Z0-9]/g, '_')
}

// Helper function to format a relative path for the report
const formatRelativePath = (basePath, targetPath) => {
  return targetPath.replace(basePath, '')
}

export {
  printInfo,
  printError,
  printSuccess,
  sanitizeName,
  formatRelativePath
} 