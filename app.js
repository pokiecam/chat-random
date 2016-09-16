const choo = require('choo')
const html = require('choo/html')
const app = choo()
const sheetify = require('sheetify')

let socket

sheetify('css-wipe', { global: true })
sheetify('css-type-base', { global: true })
sheetify('ergonomic-breakpoint', { global: true })

if (!module.parent) {
  const ws = require('websocket-stream')
  socket = ws(`ws://${location.hostname}:${location.port}`)
  socket.on('error', console.error.bind(console, 'Error:'))
}

app.model(require('./lib/login/model')(socket))
app.model(require('./lib/room/model')(socket))

function auth (view) {
  return function (state, prev, send) {
    return state.user.name ?
      view(state, prev, send) :
      require('./lib/login/view')(state, prev, send)
  }
}

app.router((route) => [
  route('/', auth(require('./lib/room/view'))),
])

if (module.parent) module.exports = app
else app.start('#root')
