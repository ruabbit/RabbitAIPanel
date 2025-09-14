export function writeEnvOnStart() {
  try {
    const envFlag = import.meta?.env?.VITE_WRITE_ENV_ON_START
    const enabled = envFlag === true || envFlag === 'true' || envFlag === '1'
    if (!enabled) return

    const apiBase = import.meta?.env?.VITE_API_BASE || ''
    if (apiBase) localStorage.setItem('api_base', apiBase)
    // Persist a snapshot for diagnostics
    const snapshot = {
      env_api_base: apiBase,
      env_debug: String(import.meta?.env?.VITE_DEBUG ?? ''),
      time: new Date().toISOString(),
    }
    localStorage.setItem('env_writeback_snapshot', JSON.stringify(snapshot))
    console.info('[EnvWriteback] Wrote env to localStorage.api_base from import.meta.env. Snapshot:', snapshot)
  } catch (e) {
    console.warn('[EnvWriteback] Failed to write env on start:', e)
  }
}
