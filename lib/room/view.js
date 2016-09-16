const html = require('choo/html')
const sf = require('sheetify')
const prefix = sf('./styles.css')

module.exports = function (state, prev, send) {

  return html`
    <main id="root" class=${prefix}>
      ${heading(state.user.name)}
      ${commands()}
      ${status(state.room.roommate)}
      <input id="message"
        name="message"
        disabled="${state.room.roommate && state.room.roommate.id ? false : true}"
        placeholder="Enter a message"
        required=true
        onkeydown=${handleMessageSend}
        />
      ${state.room.messages.length ?
        html`<dl id="messages">
          ${state.room.messages.map(showMessage)}
        </dl>` : ''
      }
    </main>`

  function showMessage (message, index) {
    return html`<li>
      <strong>${
        message.type === 'abandoned' ? 'Chat-Random' :
          message.sender.id === state.user.id ? 'You' : message.sender.name
        }:</strong>
      ${message.message}`
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

function heading (name) {
  return html`<h1>Welcome to Chat Random${name ?  ', ' + name : ''}! </h1>`
}

function commands () {
  return html`
    <p>
      You may type <code>/leave</code> or <code>/close</code> to attempt
      repairing with—or waiting for—another available chat user.
    </p>`
}

function status (roommate) {
  const text = roommate && roommate.name ?
    'You are chatting with ' + roommate.name :
    'You are in queue to speak with the next available user'
  return html`<p><strong>${text}</strong></p>`
}
