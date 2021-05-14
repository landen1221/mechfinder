fs = require('fs')
{shallow, merge} = require('../util')

files = {}

class Meta
    constructor: (@data) ->
    find: (path) -> @findWithParts(path.split('/'))
    findWithParts: (parts) ->
        m = shallow(@data['/'])
        path = ''
        for part in parts when part
            path += '/' + part
            m.heading = null
            merge(m, @data[path]) if @data[path]
            m.heading ?= m.title
        return m

module.exports = (file) ->
    files[file] ?= new Meta(JSON.parse(fs.readFileSync(file)))
    return files[file]