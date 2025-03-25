import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode, ["Dragon", "Phoenix", "Goblin", "Ogre", "quit"])
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that required functions exist with correct parameters
    const createMonstersExists = hasFunctionWithSignature('createMonsters', 0)
    const createMonsterExists = hasFunctionWithSignature('createMonster', 2)
    const getMonsterByIdExists = hasFunctionWithSignature('getMonsterById', 1)
    const deleteMonsterExists = hasFunctionWithSignature('deleteMonster', 1)
    const updateMonsterExists = hasFunctionWithSignature('updateMonster', 2)
    const findMostPowerfulExists = hasFunctionWithSignature('findMostPowerful', 1)
    const breedMonstersExists = hasFunctionWithSignature('breedMonsters', 2)
    
    // Check function definitions
    checkAndRecord('Function createMonsters is defined correctly', createMonstersExists, 10)
    checkAndRecord('Function createMonster is defined correctly', createMonsterExists, 10)
    checkAndRecord('Function getMonsterById is defined correctly', getMonsterByIdExists, 10)
    checkAndRecord('Function deleteMonster is defined correctly', deleteMonsterExists, 10)
    checkAndRecord('Function updateMonster is defined correctly', updateMonsterExists, 10)
    checkAndRecord('Function findMostPowerful is defined correctly', findMostPowerfulExists, 10)
    checkAndRecord('Function breedMonsters is defined correctly', breedMonstersExists, 10)
    
    // Initialize the gMonsters array if necessary
    const initializeMonstersArray = () => {
        // First check if gMonsters already exists and has data
        let monsters = result.context.gMonsters || []
        
        // Test that gMonsters has at least 4 monsters
        checkAndRecord('gMonsters array contains at least 4 monsters', () => {
            return monsters && Array.isArray(monsters) && monsters.length >= 4
        }, 10)
        
        if (monsters.length >= 4) return monsters 
        // If we don't have monsters, create our own test data
        const testMonsters = [
            { id: 101, name: 'Dragon', power: 80 },
            { id: 102, name: 'Phoenix', power: 70 },
            { id: 103, name: 'Goblin', power: 40 },
            { id: 104, name: 'Ogre', power: 90 }
        ]
        
        // Set gMonsters in the student's script global scope to have our test data
        return result.context.gMonsters = testMonsters
    }
    
    // If gMonsters is not initialized, initialize it for testing
    const monsters = initializeMonstersArray()

    // Test createMonster function
    checkAndRecord('createMonster creates a monster with the given name and power', () => {
        if (!createMonsterExists) return false
        
        const monsterResult = runFunction('createMonster', ['TestMonster', 50])
        if (!monsterResult.success) return false
        
        const monster = monsterResult.returnValue
        return monster && 
               monster.name === 'TestMonster' && 
               monster.power === 50 &&
               typeof monster.id === 'number'
    }, 10)

    // Test createMonster with optional parameters
    checkAndRecord('createMonster handles optional parameters correctly', () => {
        if (!createMonsterExists) return false
        
        // Test with only name parameter
        const nameOnlyResult = runFunction('createMonster', ['NameOnly'])
        if (!nameOnlyResult.success) return false
        
        const nameOnlyMonster = nameOnlyResult.returnValue
        
        // Test with no parameters
        const noParamsResult = runFunction('createMonster', [])
        if (!noParamsResult.success) return false
        
        const noParamsMonster = noParamsResult.returnValue
        
        // Check that monsters were created with default values where needed
        return nameOnlyMonster && 
               nameOnlyMonster.name === 'NameOnly' && 
               typeof nameOnlyMonster.power === 'number' &&
               typeof nameOnlyMonster.id === 'number' &&
               noParamsMonster && 
               typeof noParamsMonster.name === 'string' &&
               typeof noParamsMonster.power === 'number' &&
               typeof noParamsMonster.id === 'number'
    }, 10)

    // Test getMonsterById function
    checkAndRecord('getMonsterById returns the correct monster', () => {
        if (!getMonsterByIdExists) return false
        
        // Make sure we have monsters to test with
        if (!monsters || !monsters.length) return false
        
        // Find a random monster from the array and get its id
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)]
        const randomMonsterId = randomMonster.id

        // Test getMonsterById with the random monster id
        const getByIdResult = runFunction('getMonsterById', [randomMonsterId])
        if (!getByIdResult.success) return false
        
        const monster = getByIdResult.returnValue
        return monster?.id === randomMonsterId
    }, 10)

    // Test deleteMonster function
    checkAndRecord('deleteMonster removes the correct monster', () => {
        if (!deleteMonsterExists) return false
        
        // Make sure we have monsters to test with
        if (!monsters || !monsters.length) return false
        
        // Find a random monster from the array and get its id
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)]
        const randomMonsterId = randomMonster.id
        
        // Test deleteMonster with the random monster id
        const deleteResult = runFunction('deleteMonster', [randomMonsterId])
        if (!deleteResult.success) return false
        
        // Since we can't directly access the result of the deletion operation
        // let's verify if the getMonsterById now returns null/undefined for that ID
        const verifyResult = runFunction('getMonsterById', [randomMonsterId])
        return verifyResult.success && !verifyResult.returnValue
    }, 10)

    // Test updateMonster function
    checkAndRecord('updateMonster updates the monster power correctly', () => {
        if (!updateMonsterExists) return false
        
        // Make sure we have monsters to test with
        if (!monsters || !monsters.length) return false
        
        // Find a random monster from the array and get its id
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)]
        const randomMonsterId = randomMonster.id
        const oldPower = randomMonster.power
        
        // New power value to update to (different from current)
        const newPower = oldPower < 50 ? 95 : 45
        
        // Test updateMonster with the random monster id and new power
        const updateResult = runFunction('updateMonster', [randomMonsterId, newPower])
        if (!updateResult.success) return false
        
        // Verify that the monster was updated by checking with getMonsterById
        const verifyResult = runFunction('getMonsterById', [randomMonsterId])
        if (!verifyResult.success) return false
        
        const updatedMonster = verifyResult.returnValue
        return updatedMonster && updatedMonster.power === newPower
    }, 10)

    // Test findMostPowerful function
    checkAndRecord('findMostPowerful finds the monster with highest power', () => {
        if (!findMostPowerfulExists) return false
        
        // Make sure we have monsters to test with
        if (!monsters || !monsters.length) return false
        
        // Find the most powerful monster in the array manually for comparison
        let mostPowerfulMonster = monsters[0]
        for (let i = 1; i < monsters.length; i++) {
            if (monsters[i].power > mostPowerfulMonster.power) {
                mostPowerfulMonster = monsters[i]
            }
        }
        
        // Test findMostPowerful with the monsters array
        const powerfulResult = runFunction('findMostPowerful', [monsters])
        if (!powerfulResult.success) return false
        
        const powerfulMonster = powerfulResult.returnValue
        return powerfulMonster && powerfulMonster.id === mostPowerfulMonster.id
    }, 10)

    // Test breedMonsters function
    checkAndRecord('breedMonsters creates a monster with averaged power and combined name', () => {
        if (!breedMonstersExists) return false
        
        // Make sure we have at least 2 monsters to test with
        if (!monsters || monsters.length < 2) return false
        
        // Get two different monsters
        const parent1 = monsters[0]
        const parent2 = monsters[1]
        
        // Expected values for child monster
        const expectedPower = (parent1.power + parent2.power) / 2
        const halfIndex1 = Math.floor(parent1.name.length / 2)
        const halfIndex2 = Math.floor(parent2.name.length / 2)
        const firstHalf = parent1.name.substring(0, halfIndex1)
        const secondHalf = parent2.name.substring(halfIndex2)
        
        // Test breedMonsters with the two monster IDs
        const breedResult = runFunction('breedMonsters', [parent1.id, parent2.id])
        if (!breedResult.success) return false
        
        const childMonster = breedResult.returnValue
        
        // Check child monster properties
        return childMonster && 
               Math.abs(childMonster.power - expectedPower) < 0.1 &&
               typeof childMonster.id === 'number' &&
               childMonster.name.includes(firstHalf) &&
               childMonster.name.includes(secondHalf)
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 