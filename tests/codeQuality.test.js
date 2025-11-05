import { stripComments } from '../src/services/file-utils.service.js'
import { validateVarNames } from './validators/var-names.validator.js'
import { validateIndentation } from './validators/indentation.validator.js'
import { validateLineSpacing } from './validators/line-spacing.validator.js'
import { validateQuotes } from './validators/quotes.validator.js'
import { validateNoSemicolons } from './validators/semicolons.validator.js'

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
