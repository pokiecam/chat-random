const html = require('choo/html')

module.exports = (state, prev, send) => {

  return html`
    <main id="root">
      <h1>Please enter your name to join the queue</h1>
      <form onsubmit=${onSubmit.bind(null, send)}>
        <input id="name"
          name="name"
          value="${state.user.name ? state.user.name : ''}"
          disabled="${state.user.name ? 'disabled' : false}"
          placeholder="Enter a name"
          required="true"
          autofocus="true"
          />
      </form>
    </main>`
}

function onSubmit (send, event) {
  event.preventDefault()
  const el = event.target.children[0]
  const name = el.value.trim()
  if (name.length) return send('user:create', { name: name })
  else return el.value = ''
}
