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
    const createPlaneExists = hasFunctionWithSignature('createPlane', 2)
    const createPassengerExists = hasFunctionWithSignature('createPassenger', 1)
    const createFlightExists = hasFunctionWithSignature('createFlight', 3)
    const bookFlightExists = hasFunctionWithSignature('bookFlight', 2)
    const getFrequentFlyersExists = hasFunctionWithSignature('getFrequentFlyers', 0)
    const isFullyBookedExists = hasFunctionWithSignature('isFullyBooked', 1)
    
    // Check function definitions
    checkAndRecord('Function createPlane is defined correctly', createPlaneExists, 10)
    checkAndRecord('Function createPassenger is defined correctly', createPassengerExists, 10)
    checkAndRecord('Function createFlight is defined correctly', createFlightExists, 10)
    checkAndRecord('Function bookFlight is defined correctly', bookFlightExists, 10)
    checkAndRecord('Function getFrequentFlyers is defined correctly', getFrequentFlyersExists, 10)
    checkAndRecord('Function isFullyBooked is defined correctly', isFullyBookedExists, 10)

    // Test createPlane function
    checkAndRecord('createPlane creates a plane object with model and seatCount', () => {
        if (!createPlaneExists) return false

        const planeResult = runFunction('createPlane', ['Boeing 737', 180])
        if (!planeResult.success) return false

        const plane = planeResult.returnValue
        return plane && 
               checkReturnValueType(plane, 'object') && 
               plane.model === 'Boeing 737' && 
               plane.seatCount === 180
    }, 10)

    // Test createPassenger function
    checkAndRecord('createPassenger creates a passenger with id, fullName and empty flights array', () => {
        if (!createPassengerExists) return false

        const passengerResult = runFunction('createPassenger', ['John Doe'])
        if (!passengerResult.success) return false

        const passenger = passengerResult.returnValue
        return passenger && 
               checkReturnValueType(passenger, 'object') && 
               passenger.fullName === 'John Doe' && 
               Array.isArray(passenger.flights) && 
               passenger.flights.length === 0 &&
               typeof passenger.id === 'string' && 
               /^\d{7}$/.test(passenger.id)
    }, 10)

    // Test createFlight function
    checkAndRecord('createFlight creates a flight object with proper properties', () => {
        if (!createFlightExists || !createPlaneExists) return false

        const planeResult = runFunction('createPlane', ['Boeing 737', 180])
        if (!planeResult.success) return false
        const plane = planeResult.returnValue

        const flightResult = runFunction('createFlight', ['New York', 'London', plane])
        if (!flightResult.success) return false

        const flight = flightResult.returnValue
        return flight && 
               checkReturnValueType(flight, 'object') && 
               flight.departure === 'New York' && 
               flight.destination === 'London' && 
               flight.plane === plane && 
               Array.isArray(flight.passengers) &&
               flight.passengers.length === 0 &&
               flight.date instanceof Date
    }, 10)

    // Test bookFlight function
    checkAndRecord('bookFlight connects flight and passenger correctly', () => {
        if (!createFlightExists || !createPlaneExists || !createPassengerExists || !bookFlightExists) return false

        const planeResult = runFunction('createPlane', ['Boeing 737', 180])
        if (!planeResult.success) return false
        const plane = planeResult.returnValue

        const passengerResult = runFunction('createPassenger', ['John Doe'])
        if (!passengerResult.success) return false
        const passenger = passengerResult.returnValue

        const flightResult = runFunction('createFlight', ['New York', 'London', plane])
        if (!flightResult.success) return false
        const flight = flightResult.returnValue

        const bookResult = runFunction('bookFlight', [flight, passenger])
        if (!bookResult.success) return false

        // Check if the passenger was added to the flight's passengers
        const flightHasPassenger = flight.passengers.includes(passenger)
        
        // Check if the flight was added to the passenger's flights
        const passengerHasFlight = passenger.flights.includes(flight)

        return flightHasPassenger && passengerHasFlight
    }, 20)

    // Test getFrequentFlyers function
    checkAndRecord('getFrequentFlyers returns passengers with most flights', () => {
        if (!createFlightExists || !createPlaneExists || !createPassengerExists || !bookFlightExists || !getFrequentFlyersExists) return false

        // Create planes
        const planeResult = runFunction('createPlane', ['Boeing 737', 180])
        if (!planeResult.success) return false
        const plane = planeResult.returnValue

        // Create passengers
        const passenger1Result = runFunction('createPassenger', ['John Doe'])
        const passenger2Result = runFunction('createPassenger', ['Jane Smith'])
        const passenger3Result = runFunction('createPassenger', ['Bob Johnson'])
        if (!passenger1Result.success || !passenger2Result.success || !passenger3Result.success) return false
        
        const passenger1 = passenger1Result.returnValue
        const passenger2 = passenger2Result.returnValue
        const passenger3 = passenger3Result.returnValue

        // Create flights
        const flight1Result = runFunction('createFlight', ['New York', 'London', plane])
        const flight2Result = runFunction('createFlight', ['London', 'Paris', plane])
        if (!flight1Result.success || !flight2Result.success) return false
        
        const flight1 = flight1Result.returnValue
        const flight2 = flight2Result.returnValue

        // Book flights - passenger1 has 2 flights, others have 1 each
        runFunction('bookFlight', [flight1, passenger1])
        runFunction('bookFlight', [flight2, passenger1])
        runFunction('bookFlight', [flight1, passenger2])
        runFunction('bookFlight', [flight2, passenger3])

        // Get frequent flyers
        const frequentFlyersResult = runFunction('getFrequentFlyers', [])
        if (!frequentFlyersResult.success) return false
        
        const frequentFlyers = frequentFlyersResult.returnValue
        
        // Check if passenger1 is in the frequent flyers list
        return Array.isArray(frequentFlyers) && 
               frequentFlyers.includes(passenger1) &&
               !frequentFlyers.includes(passenger2) &&
               !frequentFlyers.includes(passenger3)
    }, 10)

    // Test isFullyBooked function
    checkAndRecord('isFullyBooked correctly identifies when a flight is fully booked', () => {
        if (!createFlightExists || !createPlaneExists || !createPassengerExists || !bookFlightExists || !isFullyBookedExists) return false

        // Create a small plane with 2 seats
        const planeResult = runFunction('createPlane', ['Small Jet', 2])
        if (!planeResult.success) return false
        const plane = planeResult.returnValue

        // Create passengers
        const passenger1Result = runFunction('createPassenger', ['John Doe'])
        const passenger2Result = runFunction('createPassenger', ['Jane Smith'])
        const passenger3Result = runFunction('createPassenger', ['Bob Johnson'])
        if (!passenger1Result.success || !passenger2Result.success || !passenger3Result.success) return false
        
        const passenger1 = passenger1Result.returnValue
        const passenger2 = passenger2Result.returnValue
        const passenger3 = passenger3Result.returnValue

        // Create flight
        const flightResult = runFunction('createFlight', ['New York', 'London', plane])
        if (!flightResult.success) return false
        const flight = flightResult.returnValue

        // Check when no passengers are booked
        const emptyResult = runFunction('isFullyBooked', [flight])
        if (!emptyResult.success) return false
        const emptyCheck = emptyResult.returnValue
        
        // Book first passenger
        runFunction('bookFlight', [flight, passenger1])
        
        // Check when partially booked
        const partialResult = runFunction('isFullyBooked', [flight])
        if (!partialResult.success) return false
        const partialCheck = partialResult.returnValue
        
        // Book second passenger (to capacity)
        runFunction('bookFlight', [flight, passenger2])
        
        // Check when fully booked
        const fullResult = runFunction('isFullyBooked', [flight])
        if (!fullResult.success) return false
        const fullCheck = fullResult.returnValue
        
        // Try to book beyond capacity
        runFunction('bookFlight', [flight, passenger3])
        
        // Verify the checks were correct
        return emptyCheck === false && 
               partialCheck === false && 
               fullCheck === true &&
               flight.passengers.length <= plane.seatCount // Should not exceed capacity
    }, 15)

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 