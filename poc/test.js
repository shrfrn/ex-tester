function bar() {
    while (true) {
        console.log('bar')
    }
}

function foo(num1, num2 ) {
    console.log('foo')
    return num1 + num2
}

function baz() {
    throw new Error('baz')
}

// foo(1, 2)
bar()
// baz()
