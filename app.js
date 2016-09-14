const choo = require('choo')
const html = require('choo/html')
const app = choo()
let socket

if (!module.parent) {
  const ws = require('websocket-stream')
  socket = ws(`ws://${location.hostname}:${location.port}`)
  socket.on('error', console.error.bind(console, 'Error:'))
}

app.model(require('./models/user')(socket))
app.model(require('./models/room')(socket))

function auth (view) {
  return function (state, prev, send) {
    return state.user.name ?
      view(state, prev, send) :
      require('./views/login')(state, prev, send)
  }
}

app.router((route) => [
  route('/', auth(require('./views/room'))),
])

if (module.parent) module.exports = app
else app.start('#root')
