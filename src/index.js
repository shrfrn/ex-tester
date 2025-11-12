import commandLineArgs from 'command-line-args'

import { runBatch } from './batch-runner.js'
import { parseNumRange, readJsonFile } from './services/util.service.js'
import { promptInput } from './cli-prompts.js'

const optionDefinitions = [
	{ name: 'config', alias: 'c', type: String, description: 'Path to a JSON config file containing predefined options' }
]

async function main() {
	console.log('Student Assignment Testing Suite')
	console.log('================================\n')

	const options = commandLineArgs(optionDefinitions)
	
	let config = {}
	
	if (options.config) {
		console.log(`Reading config from: ${options.config}`)
		config = readJsonFile(options.config)
	}
	
	const { submissionsPath, exerciseRangeInput, reportType } = await promptInput(config)
	const exerciseNumbers = parseNumRange(exerciseRangeInput)

	await runBatch({ submissionsPath, exerciseNumbers, reportType })
}

// Run the main function
main().catch(error => {
	console.error('Error in main process:', error)
	process.exit(1)
})
