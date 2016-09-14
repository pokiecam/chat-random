// Define optional command-line arguments, as well as defaults
const argv = require('minimist')(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { p: 8000 },
})

// Name our process
process.title = require('./package.json').name

// Set up application HTTP server
const server = require('./lib/server')

server.listen(process.env.PORT || argv.port, () => {
  console.log(`Server running at http://localhost:${server.address().port}`)
})

// Connect our web socket to the server
const wss = require('./lib/socket')(server)
