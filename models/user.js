const split = require('split2')
const to = require('to2')

module.exports = (stream) => {
  return {
    namespace: 'user',
    state: {
      name: null,
      id: null,
    },
    reducers: {
      receiveJoin: (data, state) => ({
        name: data.name,
        id: data.id,
      }),
    },
    effects: {
      create: (data, state, send, done) => {
        data = Object.assign(data, { type: 'join' })
        stream.write(JSON.stringify(data) + '\n')
      },
    },
    subscriptions: [
      (send, done) => {
        stream
          .pipe(split(JSON.parse))
          .pipe(to.obj((row, enc, next) => {
            if (row.type === 'join') {
              const data = {
                name: row.name,
                id: row.id,
              }
              send('user:receiveJoin', data, (err) => done(err))
              send('location:setLocation', { location: '/' }, (err) => done(err))
              window.history.pushState({}, null, '/')
            }
            next()
          }))
      },
    ],
  }
}
