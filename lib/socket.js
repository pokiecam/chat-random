const wss = require('websocket-stream')
const split = require('split2')
const to = require('to2')
const cuid = require('cuid')

// Using in-memory data stores for the sake of the demo, which does not
// include keep-alive or persistance
const streams = {}
const rooms = []

module.exports = (server) => wss.createServer({ server: server }, handle)

// Handle websocket streams
function handle (stream) {
  const streamId = cuid()
  streams[streamId] = { stream: stream }

  stream
    .on('error', console.error.bind(console))
    .on('end', () => {
      const roommate = streams[streamId].roommate
      if (roommate) {
        // Messaging for abandoned user
        const data = {
          type: 'abandoned',
          message: streams[streamId].name + ' left the chat',
        }
        streams[roommate.id].roommate = null
        streams[roommate.id].stream.write(JSON.stringify(data) + '\n')
      }
      leaveRoom(streams[streamId].roomId, streamId)
    })
    .on('close', () => { delete streams[streamId] })

  stream
    .pipe(split(JSON.parse))
    .pipe(to.obj((row, enc, next) => {

      if (row.type === 'join') {
        streams[streamId].name = row.name
        streams[streamId].roomId = joinOrCreateRoom(streamId)
        const data = {
          type: 'join',
          timestamp: Date.now(),
          name: row.name,
          id: streamId,
          roomId: streams[streamId].roomId,
          roommate: (streams[streamId].roommate ?
            streams[streamId].roommate :
            null
          ),
        }
        streams[streamId].stream.write(JSON.stringify(data) + '\n')
      }

      // If user is leaving a chat, we will respond with useful
      // information regarding their new chat status. Namely, we will
      // notifify both parties separately: the `leaving` user and the
      // `abandoned` user
      if (row.type === 'leave') {
        const leavingUser = row.sender
        const abandonedUser = streams[streamId].roommate
        // Messaging for user leaving room
        streams[streamId].roomId = joinOrCreateRoom(
          streamId,
          String(streams[streamId].roomId)
        )
        const newRoommate = getRoommate(streams[streamId].roomId, streamId)
        streams[streamId].roommate = newRoommate
        const pairingMsg = {
          type: 'pairing',
          roommate: newRoommate,
        }
        streams[streamId].stream.write(JSON.stringify(pairingMsg) + '\n')
        // Messaging for abandoned user
        const abandonedMsg = {
          type: 'abandoned',
          message: `${leavingUser.name} left the chat.`,
        }
        streams[abandonedUser.id].roommate = null
        streams[abandonedUser.id].stream
          .write(JSON.stringify(abandonedMsg) + '\n')
      }

      if (row.type === 'msg') {
        const roommate = streams[streamId].roommate
        const msg = {
          type: 'message',
          timestamp: Date.now(),
          sender: row.sender,
          recipient: roommate.name,
          message: row.message,
        }
        const u = [streamId, roommate.id]
        u.forEach((id) => (
          streams[id].stream.write(JSON.stringify(msg) + '\n')
        ))
      }

      next()
    }))
}

function getRoommate (roomId, streamId) {
  return rooms[roomId].reduce((roommate, sid) => {
    if (sid !== streamId) {
      roommate.name = streams[sid].name
      roommate.id = sid
    }
    return roommate
  }, {})
}

function joinOrCreateRoom (streamId, currentRoomId) {
  const availableRoomId = findAvailableRoom(streamId, currentRoomId)
  // If there was no available rooms, leave the current one and create a
  // new one
  if (availableRoomId === -1) {
    if (currentRoomId !== undefined) leaveRoom(currentRoomId, streamId)
    rooms.push([streamId])
  }
  // If there was an available room to enter, notify other occupant of
  // new roommate entering the room
  else {
    rooms[availableRoomId].push(streamId)
    const roommate = getRoommate(availableRoomId, streamId)
    streams[streamId].roommate = roommate
    announceArrival(availableRoomId, streamId)
  }
  return getRoomId(streamId)
}

function findAvailableRoom (streamId, currentRoomId) {
  return rooms.reduce((roomId, room, idx) => {
    if (currentRoomId === undefined || idx !== +currentRoomId) {
      if (room.length === 1 && room.indexOf(streamId) === -1) {
        roomId = idx
      }
    }
    return roomId
  }, -1)
}

function announceArrival (roomId, streamId) {
  const roommate = {
    id: streamId,
    name: streams[streamId].name,
  }
  const data = {
    type: 'pairing',
    roomId: roomId,
    roommate: roommate,
  }
  const hostId = rooms[roomId].filter((user) => (user !== streamId))[0]
  streams[hostId].roommate = roommate
  return streams[hostId].stream.write(JSON.stringify(data) + '\n')
}

function joinRoom (roomId, streamId) {
  return rooms[roomId].push(streamId)
}

function leaveRoom (roomId, streamId) {
  const idx = rooms[roomId].indexOf(streamId)
  rooms[roomId].splice(idx, 1)
  if (!rooms[roomId].length) rooms.splice(roomId, 1)
  return rooms
}

function getRoomId (streamId) {
  return rooms.reduce((roomId, room, id) => {
    if (room.indexOf(streamId) !== -1) roomId = id
    return roomId
  }, -1)
}
