// TODO extract this bloated module into more specialised ones

const split = require('split2')
const to = require('to2')

module.exports = (stream) => {
  return {
    namespace: 'room',
    state: {
      roommate: null,
      roomId: null,
      messages: [],
    },
    reducers: {
      receiveMessage: (data, state) => ({
        messages: [ ...state.messages, data ]
      }),
      pair: (data, state) => ({
        roommate: data.roommate,
        roomId: data.roomId,
        messages: [],
      }),
      abandoned: (data, state) => ({
        roommate: null,
        messages: [data],
      }),
    },
    effects: {
      sendMessage: (data, state) => stream.write(JSON.stringify(data) + '\n'),
    },
    subscriptions: [
      (send, done) => {
        stream
          .pipe(split(JSON.parse))
          .pipe(to.obj((row, enc, next) => {
            if (row.type === 'join') {
              const data = {
                roomId: row.roomId,
                roommate: row.roommate,
              }
              send('room:pair', data, (err) => done(err))
            }
            if (row.type === 'pairing') {
              const data = {
                roommate: row.roommate,
                roomId: row.roomId,
              }
              send('room:pair', data, (err) => done(err))
            }
            if (row.type === 'abandoned') {
              send('room:abandoned', row, (err) => done(err))
            }
            if (row.type === 'message') {
              send('room:receiveMessage', row, (err) => done(err))
            }
            next()
          }))
      },
    ],
  }
}
