global.MF = if 'MF' in global then MF else {}
switch (process.env.NODE_ENV || 'development')
    when 'production' then MF.properties = require(__dirname + '/app/properties').production
    when 'test' then MF.properties = require(__dirname + '/app/properties').test
    when 'development' then MF.properties = require(__dirname + '/app/properties').development

index = 0
port = MF.properties.self.port
portHTTP = MF.properties.self.portHTTP
for arg in process.argv
    if arg is '--port'
        port = process.argv[index + 1] or 3000
    else if arg is '--portHTTP'
        portHTTP = process.argv[index + 1] or 3001
    index++

console.log('Starting HTTPS listener on port %s!', port)
console.log('Starting HTTP listener on port %s!', portHTTP)
app = require('./app')
app.https.listen(port)
app.http.listen(portHTTP)
