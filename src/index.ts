import * as _ from 'lodash'
import * as lier from 'lier'
import { Tree } from 'lier/src/grammar/transform/ast-lier'
import { LierError } from 'lier/src/interfaces'

export interface ValidateOptionItem {
    lier?: Tree | string
    defaults?: any
    optional?: boolean
    empty?: boolean
    message?: string
}

export type ValidateOptions = Array<ValidateOptionItem | string> | ValidateOptionItem | string

export type OnError = (message: string) => void

export class LierValidation {
    private onerror: OnError
    constructor (onerror: OnError) {
        this.onerror = onerror
    }
    private compile (options: ValidateOptions): ValidateOptionItem[] {
        const rules: ValidateOptionItem[] = []
        if (!_.isArray(options)) {
            options = [options as ValidateOptionItem | string]
        }
        for (const option of options as Array<ValidateOptionItem | string>) {
            let rule: ValidateOptionItem
            if (_.isObject(option)) {
                rule = _.assign({}, option) as ValidateOptionItem
            } else {
                rule = {
                    lier: option
                } as ValidateOptionItem
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
                if (rule.optional && arg === undefined) {
                    continue
                }
                if (rule.hasOwnProperty('defaults')) {
                    if (_.isObjectLike(arg)) {
                        arg = _.defaultsDeep(arg, rule.defaults)
                    } else {
                        arg = args.hasOwnProperty(i + '') ? arg : rule.defaults
                    }
                    args[i] = arg
                }
                if (!arg && rule.empty) {
                    continue
                }
                if (rule.hasOwnProperty('lier')) {
                    const tree = rule.lier as Tree
                    const ret = lier.validate(arg, tree.assignment, tree.declares) as LierError[]
                    if (ret) {
                        for (const err of ret) {
                            err.path.unshift(`arguments[${i}]`)
                        }
                        self.onerror(JSON.stringify(ret))
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
