export function toast(message, duration = 2000) {
  try {
    let el = document.getElementById('rr__toast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'rr__toast'
      Object.assign(el.style, {
        position: 'fixed', top: '16px', right: '16px', zIndex: 70,
        background: 'rgba(17,24,39,0.92)', color: '#fff',
        padding: '10px 14px', borderRadius: '8px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        fontSize: '14px', lineHeight: '20px',
        opacity: '0', transform: 'translateY(-6px)',
        transition: 'opacity 120ms ease, transform 120ms ease',
        pointerEvents: 'none'
      })
      document.body.appendChild(el)
    }
    el.textContent = message
    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
    clearTimeout(window.__rr_toast_timer)
    window.__rr_toast_timer = setTimeout(() => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(-6px)'
    }, duration)
  } catch (e) {
    // As a fallback
    try { console.info('[Toast]', message) } catch {}
  }
}

