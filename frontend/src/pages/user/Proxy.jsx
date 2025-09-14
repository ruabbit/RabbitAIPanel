import React, { useState } from 'react'
import { chatCompletions } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import { currentUserId } from '../../utils/dev'

export default function Proxy() {
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState(localStorage.getItem('litellm_api_key') || '')
  const userId = currentUserId('1')
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
    <Container>
      {/* 标题移除（开发工具页保留内容区） */}
      <div className="mt-2 text-sm text-slate-700">当前用户ID：<strong>{userId}</strong></div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="rr-label" htmlFor="proxy-model">模型</label>
          <input id="proxy-model" className="rr-input" value={model} onChange={e=>setModel(e.target.value)} placeholder="gpt-4o-mini" />
        </div>
        <div>
          <label className="rr-label" htmlFor="proxy-key">x-litellm-api-key</label>
          <input id="proxy-key" className="rr-input" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="可选，代理直连时" />
        </div>
      </div>
      <div className="mt-3">
        <label className="rr-label" htmlFor="proxy-prompt">提示词</label>
        <textarea id="proxy-prompt" className="rr-textarea" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <Button onClick={onSend} color="blue">发送</Button>
        {loading && <span className="text-sm text-gray-500">请求中…</span>}
      </div>
      {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      {resp && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto mt-3">{JSON.stringify(resp, null, 2)}</pre>)}
    </Container>
  )
}
