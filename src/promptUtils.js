import path from 'path'
import fsExtra from 'fs-extra'
import inquirer from 'inquirer'
import inquirerCheckboxPlus from 'inquirer-checkbox-plus'

// Register the inquirer plugins
inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlus)


// Main function to prompt for user input
export async function promptInput() {
    // Get the current working directory as the starting point
    const currentDir = process.cwd()

    // Navigate and select a directory
    const selectedPath = await _navigateDirectories(currentDir)
    if (!selectedPath) {
        console.error('No directory selected. Exiting.')
        process.exit(1)
    }

    // Select student segment and create path with placeholder
    const submissionsPath = await _selectStudentSegment(selectedPath)

    // Get exercise range from user
    const exerciseRangeInput = await _getExerciseRange()

    // Get report type from user
    const reportType = await _selectReportType()

    return { submissionsPath, exerciseRangeInput, reportType }
}

// Get directories in the specified path
async function _getDirectories(dir) {
    try {
        const items = await fsExtra.readdir(dir, { withFileTypes: true })
        // Filter out any undefined or null items and ensure they're directories
        return items
            .filter(item => item && item.isDirectory && item.isDirectory())
            .map(item => ({
                name: item.name,
                value: path.join(dir, item.name),
            }))
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error)
        return []
    }
}

// Navigate through directories to select a path
async function _navigateDirectories(startDir) {
    let currentDir = startDir
    let selectedPath = ''
    let navigating = true

    while (navigating) {
        // Get directories in current path
        const directories = await _getDirectories(currentDir)
        const validDirectories = directories.filter(dir => dir && dir.name && dir.name !== 'undefined')

        // Create choices array
        const choices = []

        // Add option to select current directory
        choices.push({
            name: `✓ SELECT THIS DIRECTORY: ${currentDir}`,
            value: { action: 'select', path: currentDir },
        })

        // Add option to go up one directory
        if (currentDir !== '/') {
            choices.push({
                name: '.. (Go up one directory)',
                value: { action: 'navigate', path: path.join(currentDir, '..') },
            })
        }

        // Add separator
        choices.push(new inquirer.Separator('--- Directories ---'))

        // Add directories
        validDirectories.forEach(directory => {
            choices.push({
                name: directory.name,
                value: { action: 'navigate', path: directory.value },
            })
        })

        // Prompt user to select a directory
        const { selection } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selection',
                message: `Navigate to or select a directory (current: ${currentDir})`,
                choices: choices,
                pageSize: 15,
            },
        ])

        // Process selection
        if (selection.action === 'navigate') {
            currentDir = selection.path
            console.log(`Navigating to: ${currentDir}`)
        } else if (selection.action === 'select') {
            selectedPath = selection.path
            navigating = false
            console.log(`Selected directory: ${selectedPath}`)
        }
    }

    return selectedPath
}

// Prompt user to select a segment from a path to use as student name placeholder
async function _selectStudentSegment(selectedPath) {
    // Split the path into segments
    const pathSegments = selectedPath.split(path.sep).filter(segment => segment.length > 0)

    // Let user select which segment should be the student name placeholder
    const { studentSegment } = await inquirer.prompt([
        {
            type: 'list',
            name: 'studentSegment',
            message: 'Select which segment contains the student name:',
            choices: pathSegments.map((segment, index) => ({
                name: `${segment} (position ${index + 1} in path)`,
                value: index,
            })),
            pageSize: 10,
        },
    ])

    console.log(`Selected segment '${pathSegments[studentSegment]}' as student name placeholder`)

    // Create the folder pattern with the student placeholder
    const patternSegments = [...pathSegments]
    patternSegments[studentSegment] = '{student:*}'

    // Reconstruct the path with the placeholder
    return path.sep + patternSegments.join(path.sep)
}

// Prompt user for exercise range input
async function _getExerciseRange() {
    const { exerciseRangeInput } = await inquirer.prompt([
        {
            type: 'input',
            name: 'exerciseRangeInput',
            message: 'Enter the range of exercises to test (e.g., "1-13" or "1, 3-5, 12-13"):',
            validate: input => {
                if (!input) return 'Please enter a range of exercises'

                // Basic validation for the format
                const rangeRegex = /^\s*\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*\s*$/
                if (!rangeRegex.test(input)) {
                    return 'Please enter a valid range format (e.g., "1-13" or "1, 3-5, 12-13")'
                }

                return true
            },
        },
    ])

    return exerciseRangeInput
}

// Prompt user to select a report type
async function _selectReportType() {
    const { reportType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'reportType',
            message: 'Select the type of report to generate:',
            choices: [
                { name: 'Markdown Overview', value: 'mdOverview' },
                { name: 'CSV Overview', value: 'csvOverview' },
                { name: 'Markdown Detailed', value: 'mdDetailed' },
                { name: 'HTML Overview', value: 'htmlOverview' },
                { name: 'HTML Detailed', value: 'htmlDetailed' },
            ],
            default: 'htmlDetailed',
        },
    ])

    console.log(`Selected report type: ${reportType}`)
    return reportType
}
