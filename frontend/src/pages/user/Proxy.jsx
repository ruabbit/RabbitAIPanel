import React, { useState } from 'react'
import { chatCompletions } from '../../utils/api'
import Button from '../../primer/Button'

export default function Proxy() {
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState(localStorage.getItem('litellm_api_key') || '')
  const [prompt, setPrompt] = useState('Hello!')
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const onSend = async () => {
    setLoading(true); setErr(''); setResp(null)
    try {
      localStorage.setItem('litellm_api_key', apiKey)
      const data = await chatCompletions({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        xLitellmApiKey: apiKey,
      })
      setResp(data)
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded px-3 py-2" value={model} onChange={e=>setModel(e.target.value)} />
        <input className="border rounded px-3 py-2" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="x-litellm-api-key" />
      </div>
      <div>
        <textarea className="w-full border rounded px-3 py-2" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSend} color="blue">发送</Button>
        {loading && <span className="text-sm text-gray-500">请求中…</span>}
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {resp && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(resp, null, 2)}</pre>)}
    </div>
  )
}
