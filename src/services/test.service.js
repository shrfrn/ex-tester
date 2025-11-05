// Re-export from split services for backward compatibility
export { createTestCollector } from './test-collector.service.js'
export { runScript, runFunction } from './code-runner.service.js'
export { checkReturnValueType } from './type-checker.service.js'
export { getContext } from './sandbox.service.js'

// hasFunctionWithSignature needs context, so we need a wrapper
import { getContext } from './sandbox.service.js'
import { hasFunctionWithSignature as _hasFunctionWithSignature } from './type-checker.service.js'

export function hasFunctionWithSignature(functionName, expectedParamCount) {
	return _hasFunctionWithSignature(getContext(), functionName, expectedParamCount)
}
