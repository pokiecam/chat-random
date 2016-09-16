const html = require('choo/html')
const sf = require('sheetify')
const prefix = sf('./styles.css')

module.exports = (state, prev, send) => {

  return html`
    <main id="root" class=${prefix}>
      <h1>Welcome to Chat-Random!</h1>
      <p>
        <label>
          Please enter your name to join the chat queue:
          <input id="name"
            name="name"
            value="${state.user.name ? state.user.name : ''}"
            disabled="${state.user.name ? 'disabled' : false}"
            onkeydown=${onKeyDown}
            placeholder="Enter a name"
            required="true"
            autofocus="true"
            />
        </label>
      </p>
    </main>`

  function onKeyDown (event) {
    if (event.key === 'Enter') {
      const el = event.target
      const name = el.value.trim()
      if (name.length) return send('user:create', { name: name })
      else return el.value = ''
    }
  }
}
