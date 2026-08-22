const EVENT = 'site-toast'

export function showToast(message) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }))
}

export { EVENT }
