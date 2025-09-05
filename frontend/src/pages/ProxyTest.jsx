import React, { useState } from 'react'
import { chatCompletions } from '../utils/api'

export default function ProxyTest() {
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState(localStorage.getItem('litellm_api_key') || '')
  const [prompt, setPrompt] = useState('Hello!')
  const [resp, setResp] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

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
    } catch (e) {
      setErr(String(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">代理测试（LiteLLM）</h2>
      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">model</label>
            <input className="w-full border rounded px-3 py-2" value={model} onChange={e => setModel(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">x-litellm-api-key</label>
            <input className="w-full border rounded px-3 py-2" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="上游 API Key" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">消息</label>
          <textarea className="w-full border rounded px-3 py-2" rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onSend} className="bg-primary text-white px-4 py-2 rounded">发送</button>
          {loading && <span className="text-sm text-gray-500">请求中…</span>}
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {resp && (
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(resp, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}

