import decorate, { validate } from '../src'

const func = (a: number, b: string) => {
    return a + + b
}

const safeFunc = validate(['int', 'str'], func)


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

console.log(safeFunc(1, '2'))

console.log(new Test().merge({
    left: {
        name: 'a'
    }
}, {
    right: {
        name: 'b'
    }
}))