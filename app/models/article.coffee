fs = require('fs')
path = require('path')
utils = require('../util')

class Article
    constructor: (@file) ->
        @title = utils.title(path.basename(@file, '.html')).replace(/-/g, ' ')
        @slug = path.basename(@file, '.html')
    
    read: (next) -> fs.readFile @file, next

    @find: (folder, next) ->
        fs.readdir folder, (err, files) ->
            return next(err, null) if err
            next null, (new Article(f) for f in files)

    @findSync: (folder, next) -> (new Article(f) for f in fs.readdirSync(folder))

    @findOne: (folder, slug) -> new Article(path.join(folder, slug + '.html'))

module.exports = Article