const html = require('choo/html')

module.exports = function (state, prev, send) {

  return html`
    <main id="root">
      ${greeting(state.user.name)}
      <div>
        <input id="message"
          name="message"
          disabled="${state.room.roommate && state.room.roommate.id ? false : true}"
          placeholder="Enter a message"
          required=true
          onkeydown=${handleMessageSend}
          />
        ${commands()}
        ${instructions(state.room.roommate)}
      </div>
      <div id="messages">
        ${state.room.messages.map(showMessage)}
      </div>
    </main>`

  function showMessage (message, index) {
    if (message.type === 'abandoned') return html`<p>${message.message}</p>`
    return html`
      <p>
        <b>${message.sender.id === state.user.id ?
          'You' :
          message.sender.name}</b>:
        ${message.message}
      </p>`
  }

  function handleMessageSend (event) {
    if (event.key === 'Enter') {
      let msg = event.target.value.trim()
      if (msg.length) {
        // Detect if a command (close|leave) was issued
        const cmd = (/^\/(close ?|leave ?)/i).exec(msg)
        // Strip command text from rest of message
        if (cmd) msg = msg.replace(cmd[0], '')
        const type = cmd && /(close|leave)/i.test(cmd[1].split(' ')[0]) ?
          'leave' :
          'msg'
        const data = {
          type: type,
          sender: {
            id: state.user.id,
            name: state.user.name,
          },
        }
        if (type === 'msg') data.message = msg
        event.target.value = ''
        return send('room:sendMessage', data)
      }
    }
    else {
      // TODO Handle actively typing notification for roommate
      // ie. "Bob is typing a message…"
    }
  }
}

function greeting (name) {
  return html`<h1>Welcome to Chat Random${name ?  ', ' + name : ''}! </h1>`
}

function commands () {
  return html`
    <p>
      You may type \`/leave\` or \`/close\` to attempt repairing with—or
      waiting for—another available chat user.
    </p>`
}

function instructions (roommate) {
  const text = roommate && roommate.name ?
    'You are chatting with ' + roommate.name :
    'You are in queue to speak with the next available user'
  return html`<p><b>${text}</b></p>`
}
