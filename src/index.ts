import * as _ from 'lodash'
import * as lier from 'lier'
import { Tree } from 'lier/src/grammar/transform/ast-lier'
import { LierError } from 'lier/src/interfaces'

export interface ValidateRule {
    lier?: Tree | string
    defaults?: any
    optional?: boolean
    trim?: Array<string | string[]> | boolean
}

export type ValidateOptions = Array<ValidateRule | string> | ValidateRule | string

export type OnError = (message: string) => void

const innerTrim = <T>(data: T): T => {
    if (_.isObjectLike(data)) {
        for (const i in data) {
            data[i] = innerTrim(data[i])
        }
    }
    if (_.isString(data)) {
        return _.trim(data) as any
    }
    return data
}

export const trim = <T>(data: T, ignores?: Array<string | string[]>): T => {
    if (_.isObjectLike(data) && ignores && ignores.length) {
        const temps: Array<{
            path: string | string[]
            value: any
        }> = []
        const marker = {}
        for (const path of ignores) {
            const value = _.get(data, path, marker)
            if (value === marker) {
                continue
            }
            _.set(data as any, path, null)
            temps.push({
                path,
                value,
            })
        }
        const ret = innerTrim(data)
        for (const item of temps) {
            _.set(ret as any, item.path, item.value)
        }
        return ret
    }
    return innerTrim(data)
}

export class LierValidation {
    private onerror: OnError
    constructor (onerror: OnError) {
        this.onerror = onerror
    }
    private compile (options: ValidateOptions): ValidateRule[] {
        const rules: ValidateRule[] = []
        if (!_.isArray(options)) {
            options = [options as ValidateRule | string]
        }
        for (const option of options as Array<ValidateRule | string>) {
            let rule: ValidateRule
            if (_.isObject(option)) {
                rule = _.assign({}, option) as ValidateRule
            } else {
                rule = {
                    lier: option
                } as ValidateRule
            }
            if (!rule.hasOwnProperty('lier')) {
                continue
            }
            rule.lier = lier.compile(lier.parse(rule.lier as string))
            rules.push(rule)
        }
        return rules
    }
    validate (options: ValidateOptions, func) {
        const self = this
        const rules = self.compile(options)
        return function (...args) {
            for (let i = 0; i < rules.length; ++ i) {
                const rule = rules[i]
                let arg = args[i]
                if (rule.trim !== false) {
                    arg = trim(arg, rule.trim as Array<string | string[]>)
                    args[i] = arg
                }
                if (rule.hasOwnProperty('defaults')) {
                    if (_.isObjectLike(arg)) {
                        arg = _.defaultsDeep(arg, rule.defaults)
                    } else if (arg === undefined) {
                        arg = rule.defaults
                    }
                    args[i] = arg
                }
                if (rule.optional && arg === undefined) {
                    continue
                }
                if (rule.hasOwnProperty('lier')) {
                    const tree = rule.lier as Tree
                    const ret = lier.validate(arg, tree.assignment, tree.declares) as LierError[]
                    if (ret) {
                        for (const err of ret) {
                            err.path.unshift(`arguments[${i}]`)
                        }
                        return self.onerror(JSON.stringify(ret))
                    }
                }
            }
            return func.apply(this, args)
        }
    }

    decorate (options: ValidateOptions) {
        const self = this
        return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
            const func = descriptor.value
            descriptor.value = self.validate(options, func)
        }
    }
}

const defaultValidation = new LierValidation((message) => {
    throw new TypeError(message)
})

export const validate = (options: ValidateOptions, func) => {
    return defaultValidation.validate(options, func)
}

export default (options: ValidateOptions) => {
    return defaultValidation.decorate(options)
}
