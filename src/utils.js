
// Format a list of exercise numbers into a compact representation (e.g. [1,2,3,5,6,7,10] -> "1-3, 5-7, 10")
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
