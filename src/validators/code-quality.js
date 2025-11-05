import { stripComments } from '../services/file-utils.service.js'
import { validateVarNames } from './var-names.validator.js'
import { validateIndentation } from './indentation.validator.js'
import { validateLineSpacing } from './line-spacing.validator.js'
import { validateQuotes } from './quotes.validator.js'
import { validateNoSemicolons } from './semicolons.validator.js'

export function validateCodeQuality(exerciseFile) {
    const codeString = stripComments(exerciseFile)
    const results = [
        validateVarNames(codeString),
        validateIndentation(codeString),
        validateLineSpacing(codeString),
        validateQuotes(codeString),
        validateNoSemicolons(codeString),
    ]

	return {
		score: results.reduce((acc, result) => acc + result.score, 0),
		results,
	}
}

// Re-export validators for backward compatibility
export { validateVarNames, validateIndentation, validateLineSpacing, validateQuotes, validateNoSemicolons }
