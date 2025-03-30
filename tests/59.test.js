import { runScript, runFunction, hasFunctionWithSignature, checkReturnValueType } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that required functions exist with correct parameters
    const createBingoBoardExists = hasFunctionWithSignature('createBingoBoard', 0)
    const printBingoBoardExists = hasFunctionWithSignature('printBingoBoard', 1)
    const drawNumExists = hasFunctionWithSignature('drawNum', 0)
    const markBoardExists = hasFunctionWithSignature('markBoard', 2)
    const checkBingoExists = hasFunctionWithSignature('checkBingo', 1)
    const playBingoExists = hasFunctionWithSignature('playBingo', 0)
    const resetNumsExists = hasFunctionWithSignature('resetNums', 0)
    
    // Check function definitions
    checkAndRecord('Function createBingoBoard is defined correctly', createBingoBoardExists, 10)
    checkAndRecord('Function printBingoBoard is defined correctly', printBingoBoardExists, 10)
    checkAndRecord('Function drawNum is defined correctly', drawNumExists, 10)
    checkAndRecord('Function markBoard is defined correctly', markBoardExists, 10)
    checkAndRecord('Function checkBingo is defined correctly', checkBingoExists, 10)
    checkAndRecord('Function playBingo is defined correctly', playBingoExists, 10)
    checkAndRecord('Function resetNums is defined correctly', resetNumsExists, 10)

    // Test createBingoBoard function
    checkAndRecord('createBingoBoard creates a 5x5 matrix', () => {
        if (!createBingoBoardExists) return false
        
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        const board = boardResult.returnValue
        
        // Check if it's a 5x5 matrix
        if (!Array.isArray(board) || board.length !== 5) return false
        
        for (let row = 0; row < 5; row++) {
            if (!Array.isArray(board[row]) || board[row].length !== 5) return false
            
            // Check each cell has the correct structure
            for (let col = 0; col < 5; col++) {
                const cell = board[row][col]
                if (!cell || typeof cell !== 'object') return false
                if (typeof cell.value !== 'number') return false
                if (typeof cell.isHit !== 'boolean') return false
            }
        }
        
        return true
    }, 10)
    
    // Test printBingoBoard function
    checkAndRecord('printBingoBoard uses console.table', () => {
        if (!printBingoBoardExists || !createBingoBoardExists) return false
        
        // First create a board to print
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        // Then print it
        const printResult = runFunction('printBingoBoard', [boardResult.returnValue])
        
        // Check if console.table was called
        return printResult.callCounts.consoleTable > 0
    }, 10)
    
    // Check if printBingoBoard correctly formats the output with hit markers
    checkAndRecord('printBingoBoard correctly shows hit markers', () => {
        if (!printBingoBoardExists || !createBingoBoardExists) return false
        
        // Create a board and mark some cells as hit
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        const board = boardResult.returnValue
        
        // Mark a few cells as hit
        board[0][0].isHit = true
        board[2][2].isHit = true
        
        // Print the board with hits
        const printResult = runFunction('printBingoBoard', [board])
        if (!printResult.success) return false
        
        // Check console output for v markers
        const outputHasMarkers = (() => {
            // Join all console outputs into a single string
            const fullOutput = printResult.consoleOutput.join(' ')
            
            // Count occurrences of 'v' or 'V' using regex
            const vMarkerMatches = fullOutput.match(/v/gi)
            
            // We should find exactly 2 markers for the 2 hit cells we marked
            return vMarkerMatches && vMarkerMatches.length === 2
        })()
        
        return outputHasMarkers
    }, 10)
    
    // Check if printBingoBoard displays all board cells
    checkAndRecord('printBingoBoard displays all board cells', () => {
        if (!printBingoBoardExists || !createBingoBoardExists) return false
        
        // Create a board with predictable values for testing
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        const board = boardResult.returnValue
        
        // Set specific values in the board for checking
        const testValues = []
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                // Set a unique value for each cell
                const uniqueValue = row * 10 + col + 1
                board[row][col].value = uniqueValue
                testValues.push(uniqueValue)
            }
        }
        
        // Print the board
        const printResult = runFunction('printBingoBoard', [board])
        if (!printResult.success) return false
        
        // Check if all values are present in the output
        const outputData = printResult.consoleOutput.join(' ')
        
        // Check each test value with a flexible regex pattern
        // Pattern matches:
        // - The number with optional leading zeros (e.g., "01" or "1")
        // - The number with optional spaces around it
        // - The number with optional parentheses or brackets
        // - The number with optional 'v' or 'V' before or after it (for hit markers)

        const allValuesFound = testValues.every(value => {
            const pattern = new RegExp(`\\b0*${value}\\b|\\[${value}\\]|\\(${value}\\)|${value}\\s*[vV]?|[vV]?\\s*${value}`, 'i')
            return pattern.test(outputData)
        })
        
        return allValuesFound
    }, 10)
    
    // Test drawNum function
    checkAndRecord('drawNum returns unique random numbers between 1-99', () => {
        if (!drawNumExists) return false
        
        // Reset the nums array if needed
        if (resetNumsExists) {
            const resetResult = runFunction('resetNums')
            if (!resetResult.success) return false
        }
        
        // Call drawNum 99 times to verify all numbers are drawn exactly once
        const numbers = new Set()
        for (let i = 0; i < 99; i++) {
            const drawResult = runFunction('drawNum')
            if (!drawResult.success) return false
            
            const num = drawResult.returnValue
            if (!checkReturnValueType(num, 'number')) return false
            
            // Check if number is in valid range
            if (num < 1 || num > 99) return false
            
            // Check if number is unique
            if (numbers.has(num)) return false
            
            numbers.add(num)
        }
        
        // Verify we got exactly 99 unique numbers
        return numbers.size === 99
    }, 10)
    
    // Test markBoard function
    checkAndRecord('markBoard marks matching cells and updates hitCount', () => {
        if (!markBoardExists || !createBingoBoardExists) return false
        
        // Create a test player with a board
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        const player = {
            name: 'TestPlayer',
            hitCount: 0,
            board: boardResult.returnValue
        }
        
        // Test multiple cells in different positions
        const testCases = [
            { row: 0, col: 0 },  // Top-left
            { row: 0, col: 4 },  // Top-right
            { row: 2, col: 2 },  // Center
            { row: 4, col: 0 },  // Bottom-left
            { row: 4, col: 4 },  // Bottom-right
            { row: 1, col: 1 },  // Inner top-left
            { row: 1, col: 3 },  // Inner top-right
            { row: 3, col: 1 },  // Inner bottom-left
            { row: 3, col: 3 }   // Inner bottom-right
        ]
        
        // Test each cell
        const allCellsMarked = testCases.every(({ row, col }, index) => {
            const testNumber = player.board[row][col].value
            
            // Mark the board with that number
            const markResult = runFunction('markBoard', [player, testNumber])
            if (!markResult.success) return false
            
            // Check if the cell was marked and hitCount updated
            const cellMarked = player.board[row][col].isHit === true
            const hitCountUpdated = player.hitCount === index + 1
            
            return cellMarked && hitCountUpdated
        })
        
        // Verify final hitCount
        return allCellsMarked && player.hitCount === testCases.length
    }, 10)
    
    // Test checkBingo function
    checkAndRecord('checkBingo correctly detects win conditions', () => {
        if (!checkBingoExists || !createBingoBoardExists) return false
        
        // Create a test player with a board
        const boardResult = runFunction('createBingoBoard')
        if (!boardResult.success) return false
        
        const player = {
            name: 'TestPlayer',
            hitCount: 0,
            board: boardResult.returnValue
        }
        
        // Test cases with different hit patterns
        const testCases = [
            { hits: 0, expected: false },   // No hits
            { hits: 5, expected: false },   // Some hits but not enough
            { hits: 12, expected: false },  // Half the board
            { hits: 24, expected: false },  // Almost full
            { hits: 25, expected: true }    // Full board
        ]
        
        // Test each case
        return testCases.every(({ hits, expected }) => {
            // Reset the board
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    player.board[row][col].isHit = false
                }
            }
            player.hitCount = 0
            
            // Mark the specified number of cells
            let count = 0
            for (let row = 0; row < 5 && count < hits; row++) {
                for (let col = 0; col < 5 && count < hits; col++) {
                    player.board[row][col].isHit = true
                    player.hitCount++
                    count++
                }
            }
            
            // Check the result
            const checkResult = runFunction('checkBingo', [player])
            if (!checkResult.success) return false
            
            return checkResult.returnValue === expected
        })
    }, 10)
    
    // Test that game executes until a player wins
    checkAndRecord('Game correctly runs until a player wins', () => {
        if (!playBingoExists || !createBingoBoardExists) return false
        
        // Run the script to set up the game
        const scriptResult = runScript(studentCode)
        if (!scriptResult.success) return false
        
        // Check if gPlayers exists and has at least 2 players
        const playersExist = scriptResult.variables.declared.includes('gPlayers')
        if (!playersExist) return false
        
        // Get the players array from the context
        const players = scriptResult.context.gPlayers
        if (!Array.isArray(players) || players.length < 2) return false
        
        // Verify each player has the correct structure
        const playersValid = 
            players.every(player => 
                player && typeof player === 'object' &&
                typeof player.name === 'string' && 
                typeof player.hitCount === 'number' && 
                Array.isArray(player.board))
                
        if (!playersValid) return false
        
        // Check that setInterval was called
        if (scriptResult.callCounts.setInterval === 0) return false
        
        // Check that clearInterval was called (game should end)
        if (scriptResult.callCounts.clearInterval === 0) return false
        
        // Check that no intervals remain active
        if (scriptResult.activeIntervalIds.length > 0) return false
        
        // Verify that one player has won (all cells hit)
        const hasWinner = players.some(player => {
            // Check hitCount
            if (player.hitCount !== 25) return false
            
            // Verify all cells are hit
            return player.board.every(row => row.every(cell => cell.isHit))
        })
        
        // Verify that the interval callback was invoked at least 25 times
        // (one for each cell that needs to be hit)
        const intervalId = scriptResult.activeIntervalIds[0] // Get the first interval ID
        const callbackCount = scriptResult.callCounts.intervalCallbacks[intervalId] || 0
        const enoughInvocations = callbackCount >= 25
        
        return hasWinner && enoughInvocations
    }, 20)
    
    // Test resetNums function
    checkAndRecord('resetNums initializes the array of numbers', () => {
        if (!resetNumsExists) return false
        
        const resetResult = runFunction('resetNums')
        if (!resetResult.success) return false
        
        // Check if the global variable gNums exists and is an array
        const numsExists = result.variables.declared.includes('gNums')
        if (!numsExists) return false
        
        // Check that gNums is properly initialized
        const gNums = result.context.gNums
        if (!Array.isArray(gNums)) return false
        
        // Check that it contains numbers 1-99
        const expectedNums = new Set(Array.from({ length: 99 }, (_, i) => i + 1))
        const actualNums = new Set(gNums)
        
        // Verify all numbers 1-99 are present
        const allNumbersPresent = Array.from(expectedNums).every(num => actualNums.has(num))
        
        // Verify no extra numbers
        const noExtraNumbers = actualNums.size === 99
        
        // Verify we can still draw numbers
        const drawResult = runFunction('drawNum')
        const drawSuccess = 
            drawResult.success && 
            typeof drawResult.returnValue === 'number'
        
        return allNumbersPresent && noExtraNumbers && drawSuccess
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 