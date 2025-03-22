import { runScript } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    const firstName = 'John'
    const lastName = 'Smith'
    const result = runScript(studentCode, [firstName, lastName])

    checkAndRecord('Code executes successfully', result.success, 20)

    checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    checkAndRecord('fullName variable declared', 
            result.variables.declared.includes('fullName'), 10)

    checkAndRecord('fullName variable accessed', 
            result.variables.accessed.includes('fullName'), 10)

    checkAndRecord('fullName value is structured correctly', () => {
        const fullNameValue = result.context.fullName
        const nameOrderPattern = new RegExp(`^${firstName}.*${lastName}$`)
        return fullNameValue && nameOrderPattern.test(fullNameValue)
    }, 10)

    checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    checkAndRecord('Output contains first name', 
        result.consoleOutput.some(output => output.includes(firstName)), 10)

    checkAndRecord('Output contains last name', 
        result.consoleOutput.some(output => output.includes(lastName)), 10)

    const pass = checkAndRecord('Valid greeting format', () => {
        return result.allOutput.some(output => {
            const namePattern = new RegExp(`${firstName}\\s+${lastName}`)
            const hasCorrectNameFormat = namePattern.test(output)
            const hasAdditionalWord = output.split(/\s+/).length > 2

            return hasCorrectNameFormat && hasAdditionalWord
        })
    }, 10)

    const testCases = [
        ['Alice', 'Johnson'],
        ['María', 'García'],
        ['Alex', 'Smith-Johnson'],
    ]
    const allOutputs = new Set()

    testCases.forEach(([firstName, lastName]) => {
        const result = runScript(studentCode, [firstName, lastName])
        allOutputs.add(JSON.stringify(result.allOutput))
    })

    checkAndRecord('Outputs differ for different inputs', allOutputs.size === 3, 10)

    checkAndRecord('fullName concatenation syntax correct', () => {
        const regex = /fullName\s*=\s*firstName\s*\+\s*['"][ ]['"]\s*\+\s*lastName/
        return regex.test(studentCode)
    }, 10)

    return { ...getResults(), success: result.success, weight: 1, studentCode }
}