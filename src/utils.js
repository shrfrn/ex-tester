
// Format a list of numbers into a compact representation (e.g. [1,2,3,5,6,7,10] -> "1-3, 5-7, 10")
export function compactNumberList(nums) {
	if (!nums || nums.length === 0) return ''

	const ranges = []
	let rangeStart = nums[0]
	let rangeEnd = nums[0]

	for (let i = 1; i < nums.length; i++) {
		if (nums[i] === rangeEnd + 1) {
			rangeEnd = nums[i]
		} else {
			// End of a range
			if (rangeStart === rangeEnd) {
				ranges.push(`${rangeStart}`)
			} else {
				ranges.push(`${rangeStart}-${rangeEnd}`)
			}
			rangeStart = rangeEnd = nums[i]
		}
	}

	// Add the last range
	if (rangeStart === rangeEnd) {
		ranges.push(`${rangeStart}`)
	} else {
		ranges.push(`${rangeStart}-${rangeEnd}`)
	}

	return ranges.join(', ')
}

// Format a compact representation of numbers into an expanded list (e.g. "1-3, 5-7, 10" -> [1,2,3,5,6,7,10])
export function parseNumRange(input) {
	const numbers = []
	const rangeRegex = /(\d+)\s*-\s*(\d+)|(\d+)/g

	for (const match of input.matchAll(rangeRegex)) {
		const [, rangeStart, rangeEnd, singleNum] = match
		if (rangeStart) {
			// Handle range
			for (let i = Number(rangeStart); i <= Number(rangeEnd); i++) {
				numbers.push(i)
			}
		} else {
			// Handle single number
			numbers.push(Number(singleNum))
		}
	}

	return [...new Set(numbers)].sort((a, b) => a - b)
}

