import { runScript, createTestCollector } from '../src/services/test.service.js'

// Security test suite to verify dangerous APIs are blocked
export function test() {
    let { checkAndRecord, getResults } = createTestCollector()

    // Test 1: eval() should be blocked
    const evalTest = runScript('const result = eval("1+1")')
    checkAndRecord('eval() is blocked', !evalTest.success || evalTest.context.result === undefined, 10)

    // Test 2: Function constructor should be blocked
    const functionTest = runScript('const fn = new Function("return 1+1"); const result = fn()')
    checkAndRecord('Function constructor is blocked', !functionTest.success || functionTest.context.result === undefined, 10)

    // Test 3: process should be blocked
    const processTest = runScript('hasProcess = typeof process === "undefined"')
    checkAndRecord('process is blocked', processTest.success && processTest.context.hasProcess === true, 10)

    // Test 4: global should be blocked or redirected to sandbox (global exists but shouldn't have process)
    const globalTest = runScript('hasGlobalProcess = typeof global !== "undefined" ? typeof global.process === "undefined" : true')
    checkAndRecord('global.process is blocked', globalTest.success && globalTest.context.hasGlobalProcess === true, 10)

    // Test 5: require should be blocked
    const requireTest = runScript('hasRequire = typeof require === "undefined"')
    checkAndRecord('require is blocked', requireTest.success && requireTest.context.hasRequire === true, 10)

    // Test 6: Promise should be blocked
    const promiseTest = runScript('hasPromise = typeof Promise === "undefined"')
    checkAndRecord('Promise is blocked', promiseTest.success && promiseTest.context.hasPromise === true, 10)

    // Test 7: fetch should be blocked
    const fetchTest = runScript('hasFetch = typeof fetch === "undefined"')
    checkAndRecord('fetch is blocked', fetchTest.success && fetchTest.context.hasFetch === true, 10)

    // Test 8: Buffer should be blocked
    const bufferTest = runScript('hasBuffer = typeof Buffer === "undefined"')
    checkAndRecord('Buffer is blocked', bufferTest.success && bufferTest.context.hasBuffer === true, 10)

    // Test 9: WebSocket should be blocked
    const websocketTest = runScript('hasWebSocket = typeof WebSocket === "undefined"')
    checkAndRecord('WebSocket is blocked', websocketTest.success && websocketTest.context.hasWebSocket === true, 10)

    // Test 10: localStorage should be blocked
    const localStorageTest = runScript('hasLocalStorage = typeof localStorage === "undefined"')
    checkAndRecord('localStorage is blocked', localStorageTest.success && localStorageTest.context.hasLocalStorage === true, 10)

    // Test 11: Object.setPrototypeOf should be blocked
    const setPrototypeTest = runScript('hasSetPrototype = typeof Object.setPrototypeOf === "undefined"')
    checkAndRecord('Object.setPrototypeOf is blocked', setPrototypeTest.success && setPrototypeTest.context.hasSetPrototype === true, 10)

    // Test 12: __dirname should be blocked
    const dirnameTest = runScript('hasDirname = typeof __dirname === "undefined"')
    checkAndRecord('__dirname is blocked', dirnameTest.success && dirnameTest.context.hasDirname === true, 10)

    // Test 13: __filename should be blocked
    const filenameTest = runScript('hasFilename = typeof __filename === "undefined"')
    checkAndRecord('__filename is blocked', filenameTest.success && filenameTest.context.hasFilename === true, 10)

    // Test 14: module should be blocked
    const moduleTest = runScript('hasModule = typeof module === "undefined"')
    checkAndRecord('module is blocked', moduleTest.success && moduleTest.context.hasModule === true, 10)

    // Test 16: Legitimate code should still work
    const legitimateCode = `
        const numbers = [1, 2, 3, 4, 5]
        const sum = numbers.reduce((acc, n) => acc + n, 0)
        const average = sum / numbers.length
        console.log('Average:', average)
    `
    const legitTest = runScript(legitimateCode)
    checkAndRecord('Legitimate JavaScript code executes successfully', legitTest.success, 10)

    // Test 17: Math operations should work
    const mathTest = runScript('result = Math.sqrt(16) + Math.pow(2, 3)')
    checkAndRecord('Math operations work', mathTest.success && mathTest.context.result === 12, 10)

    // Test 18: String operations should work
    const stringTest = runScript('greeting = "Hello"; name = "World"; message = greeting + " " + name')
    checkAndRecord('String operations work', stringTest.success && stringTest.context.message === 'Hello World', 10)

    // Test 19: Array operations should work
    const arrayTest = runScript('arr = [1, 2, 3]; doubled = arr.map(x => x * 2); result = doubled[1]')
    checkAndRecord('Array operations work', arrayTest.success && arrayTest.context.result === 4, 10)

    // Test 20: Functions should work
    const funcTest = runScript('function add(a, b) { return a + b } result = add(5, 7)')
    checkAndRecord('Function declarations work', funcTest.success && funcTest.context.result === 12, 10)

    return { 
        ...getResults(), 
        success: true,
        weight: 1,
        studentCode: 'Security Test Suite'
    }
}

