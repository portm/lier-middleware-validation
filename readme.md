[![npm version](https://badge.fury.io/js/lier-middleware-validation.svg)](https://badge.fury.io/js/lier-middleware-validation)

# Quick Start

```js
import { validate } from '../src'

const func = (a: number, b: string) => {
    return a + + b
}

const safeFunc = validate(['int', 'str'], func)

console.log(safeFunc(1, '2')) // success

console.log(safeFunc(1, 2)) // error
```

decorate

```js
import decorate from '../src'

class Test {
    @decorate([
        `{
            left: {
                name: str
            }
        }`,
        `{
            right: {
                name: str
            }
        }`
    ])
    merge (a, b) {
        return true
    }
}

console.log(new Test().merge({
    left: {
        name: 'a'
    }
}, {
    right: {
        name: 'b'
    }
})) // success

console.log(new Test().merge({
    left: {
        name: 'a'
    }
}, {
    right: {
        name: 2
    }
})) // error
```

custom error

```js
import { LierValidation } from '../src'

const validator = new LierValidation((message: string) => {
    console.error(400, message)
    throw new Error(message)
})

const safeFunc = validator.validate(['int', 'str'], func)

console.log(safeFunc(1, '2')) // success

console.log(safeFunc(1, 2)) // error
```