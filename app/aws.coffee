knox = require('knox')

# mechfinder.com specific keys
KEY = 'AKIAJPJK2XXXXXDHPB4A'
SECRET = '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'

exports.static = knox.createClient(
    key: KEY
    secret: SECRET
    bucket: 'mechfinder-static'
)

exports.ugc = knox.createClient(
    key: KEY
    secret: SECRET
    bucket: 'mechfinder-ugc'
)

SQS_DEFAULTS = {
    key: KEY
    secret: SECRET
    version: '2011-10-01'
    url: ''
}

class SimpleQueueService
    constructor: (opts) ->

exports.sqs = (queue) ->
    new SimpleQueueService(queue: queue)
