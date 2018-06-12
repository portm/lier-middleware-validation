let kit = require('nokit')

module.exports = function (task) {
    task('default', function () {
        return kit.spawn('tsc', ['-w'])
    })

    task('build', function () {
        return kit.spawn('tsc')
    })

    task('test', function () {
        return kit.spawn('junit', ['test/*.js'])
    })

    task('lab', function () {
        return kit.spawn('noe', [
            '-b', 'node',
            '-w', 'test/lab.js', '--',

            '--harmony',

            'test/lab.js'
        ]);
    })
}
