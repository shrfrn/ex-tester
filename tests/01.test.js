import fs from 'fs'

import { runScript, outputContains } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'

export function test(studentFilePath) {
    let studentCode = fs.readFileSync(studentFilePath, 'utf8')
    let collector = createTestCollector()

    const firstName = 'John'
    const lastName = 'Smith'
    const result = runScript(studentCode, [firstName, lastName])

    collector.checkAndRecord('Code executes successfully', result.success, 30)

    collector.checkAndRecord('Prompt called at least twice', result.callCounts.prompt >= 2, 10)
    collector.checkAndRecord('At least two variables store prompt results', () => {
        const promptPattern = /(let|const|var)[\s\S]*?=[\s\S]*?prompt/g
        const matches = studentCode.match(promptPattern) || []
        return matches.length >= 2
    }, 10)

    collector.checkAndRecord('fullName variable declared', 
            result.variables.declared.includes('fullName'), 10)

    collector.checkAndRecord('fullName variable accessed', 
            result.variables.accessed.includes('fullName'), 10)

    collector.checkAndRecord('fullName value is structured correctly', () => {
        const fullNameValue = result.variables.values.fullName
        const nameOrderPattern = new RegExp(`^${firstName}.*${lastName}$`)
        return fullNameValue && nameOrderPattern.test(fullNameValue)
    }, 10)

    collector.checkAndRecord('Output method used', 
            result.callCounts.alert + result.callCounts.consoleLog > 0, 10)

    collector.checkAndRecord('Output contains first name', 
            outputContains(result.allOutput, firstName), 10)

    collector.checkAndRecord('Output contains last name', 
            outputContains(result.allOutput, lastName), 10)

    collector.checkAndRecord('Valid greeting format', () => {
        result.allOutput.some(output => {
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
        const result = runCode(studentCode, [firstName, lastName])
        allOutputs.add(JSON.stringify(result.allOutput))
    })

    collector.checkAndRecord('Outputs differ for different inputs', allOutputs.size === 3, 10)

    collector.checkAndRecord('fullName concatenation syntax correct', () => {
        const regex = /fullName\s*=\s*firstName\s*[\+]\s*lastName/
        return regex.test(studentCode)
    }, 10)

    return collector.getResults()
}