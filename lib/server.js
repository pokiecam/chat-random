const http = require('http')
const fs = require('fs')
const path = require('path')
const hyperstream = require('hyperstream')
const browserify = require('browserify')
const app = require('../app')

module.exports = http.createServer((req, res) => {
  if (req.url === '/bundle.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' })
    browserify('./app.js', { debug: true })
      .bundle()
      .pipe(res)
  }
  else {
    const state = {}
    const html = app.toString(req.url, state)
    const hs = hyperstream({ 'body': { _appendHtml: html }})
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.createReadStream(path.resolve('./index.html'))
      .pipe(hs)
      .pipe(res)
  }
})
