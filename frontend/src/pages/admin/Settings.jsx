import React, { useEffect, useState } from 'react'
import Container from '../../primer/Container'
import Card from '../../primer/Card'
import Button from '../../primer/Button'
import { getSystemSettings, updateSystemSettings, getSystemSettingsKeys, testStripeConnection, testLagoConnection, testLiteLLMConnection } from '../../utils/api'

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState([]) // flat list from DB
  const [dbLayer, setDbLayer] = useState(0)
  const [devKeyConfigured, setDevKeyConfigured] = useState(false)
  const [message, setMessage] = useState('')
  const [groups, setGroups] = useState({}) // { groupName: [meta...] }
  const [meta, setMeta] = useState([]) // [{key,group,label,type,sensitive}]
  const [errs, setErrs] = useState({}) // { key: errorMessage }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const [r, mk] = await Promise.all([getSystemSettings(), getSystemSettingsKeys()])
        if (!mounted) return
        const list = (r.settings || []).filter(it => it.key !== 'db_layer')
        setEntries(list.map(it => ({ key: it.key, value: it.value ?? '', masked: !!it.masked, configured: !!it.configured })))
        setDbLayer(Number(r.db_layer || 0))
        setDevKeyConfigured(!!r.dev_api_key_configured)
        setGroups(mk.groups || {})
        setMeta(mk.keys || [])
      } catch (e) { setError(String(e)) }
      finally { setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const onChangeEntry = (idx, field, val) => {
    setEntries(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
    try {
      const k = entries[idx]?.key
      if (k) validateSingle(k, field === 'value' ? val : entries[idx]?.value)
    } catch {}
  }

  const onAddEntry = () => {
    setEntries(prev => [...prev, { key: '', value: '' }])
  }

  const onRemoveEntry = (idx) => {
    setEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const onSave = async () => {
    setMessage(''); setError(''); setLoading(true)
    try {
      // Validate duplicate keys
      const keys = entries.map(e => e.key.trim()).filter(Boolean)
      const dup = keys.find((k, i) => keys.indexOf(k) !== i)
      if (dup) throw new Error(`存在重复键：${dup}`)
      // Build values map (ignore empty key rows)
      const values = {}
      for (const e of entries) {
        const k = (e.key || '').trim()
        if (!k) continue
        if (k.toLowerCase() === 'db_layer' || k.toLowerCase() === 'dev_api_key') continue
        values[k] = String(e.value ?? '')
      }
      if (Object.keys(values).length === 0) throw new Error('没有可保存的设置')
      // final validation
      const keysToCheck = Object.keys(values)
      for (const k of keysToCheck) {
        validateSingle(k, values[k])
      }
      if (Object.keys(errs).length > 0) throw new Error('请先修正表单校验错误')
      await updateSystemSettings(values)
      setMessage('已保存')
    } catch (e) { setError(String(e?.message || e)) }
    finally { setLoading(false) }
  }

  function validateSingle(key, value) {
    const m = meta.find(x => x.key === key)
    if (!m) { setErrs(prev => { const n = { ...prev }; delete n[key]; return n }) ; return }
    const t = m.type || 'string'
    let msg = ''
    if (t === 'int') {
      const iv = Number(value)
      if (!Number.isInteger(iv)) msg = '必须为整数'
      if (!msg && typeof m.min === 'number' && iv < m.min) msg = `不能小于 ${m.min}`
    } else if (t === 'bool') {
      // no-op
    } else if (t === 'enum') {
      if (m.enum && !m.enum.includes(String(value))) msg = `必须为 ${m.enum.join('/')}`
    } else if (m.format === 'url') {
      const sv = String(value || '')
      if (sv && !/^https?:\/\//i.test(sv)) msg = '必须为 http/https URL'
    }
    setErrs(prev => {
      const n = { ...prev }
      if (msg) n[key] = msg; else delete n[key]
      return n
    })
  }

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">系统设置</div>

        <Card>
          <div className="text-sm text-gray-700">
            <div>数据库版本（Layer）：<span className="font-mono">{dbLayer}</span></div>
            <div className="mt-1">DEV_API_KEY：来源环境变量（{devKeyConfigured ? '已配置' : '未配置'}）</div>
            <div className="text-xs text-gray-500 mt-1">说明：除 DEV_API_KEY 外，其它设置均通过数据库的 settings 表存储与加载。</div>
          </div>
        </Card>

        {/* Grouped settings by metadata */}
        {Object.keys(groups).length > 0 && (
          Object.entries(groups).map(([gname, items]) => (
            <Card key={gname}>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">
                  {gname === 'payments' ? '支付' : gname === 'lago' ? 'Lago' : gname === 'litellm' ? 'LiteLLM' : gname === 'auth' ? '认证/Logto' : gname === 'rate_limit' ? '限流' : gname === 'overdraft' ? '透支/降级' : '其它'}
                </div>
                {(gname === 'payments' || gname === 'lago' || gname === 'litellm') && (
                  <div className="flex items-center gap-2">
                    {gname === 'payments' && (
                      <Button variant="outline" onClick={async()=>{
                        try{
                          const r = await testStripeConnection();
                          if (r.ok) alert(`Stripe 连接成功\nAccount: ${r.account?.id || ''} ${r.account?.name || ''}`)
                          else alert(`Stripe 连接失败: ${r.error || 'unknown'}`)
                        } catch(e){ alert(String(e)) }
                      }}>测试连接</Button>
                    )}
                    {gname === 'lago' && (
                      <Button variant="outline" onClick={async()=>{
                        try{
                          const r = await testLagoConnection();
                          if (r.ok) alert(`Lago 可达 (HTTP ${r.status || ''}) at ${r.endpoint || ''}`)
                          else alert(`Lago 测试失败: ${r.error || 'unknown'}`)
                        } catch(e){ alert(String(e)) }
                      }}>测试连接</Button>
                    )}
                    {gname === 'litellm' && (
                      <Button variant="outline" onClick={async()=>{
                        try{
                          const r = await testLiteLLMConnection();
                          if (r.ok) alert(`LiteLLM 可达 (HTTP ${r.status || ''}) at ${r.endpoint || ''}`)
                          else alert(`LiteLLM 测试失败: ${r.error || 'unknown'}`)
                        } catch(e){ alert(String(e)) }
                      }}>测试连接</Button>
                    )}
                  </div>
                )}
              </div>
              {/* Group-level error aggregator */}
              {(() => {
                const groupErrs = (items || []).filter(m => errs[m.key])
                if (groupErrs.length === 0) return null
                return (
                  <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                    存在以下设置项校验错误：{groupErrs.map(m => m.label || m.key).join('、')}
                  </div>
                )
              })()}
              <div className="grid grid-cols-1 gap-3">
                {items.map((m, idx) => {
                  const i = entries.findIndex(e => e.key === m.key)
                  const cur = i >= 0 ? entries[i] : { key: m.key, value: '', masked: !!m.sensitive, configured: false }
                  const label = m.label || m.key
                  const placeholder = m.sensitive ? '敏感值（已配置）—保存后不回显' : (m.desc || 'value')
                  return (
                    <div key={m.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <div className="md:col-span-3">
                        <div className="text-sm text-gray-700 font-medium">{label}</div>
                        <div className="text-xs text-gray-500 font-mono">{m.key}</div>
                      </div>
                      <div className="md:col-span-7 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                        {m.type === 'bool' ? (
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={String(cur.value).toLowerCase() === 'true' || cur.value === true || cur.value === '1'}
                              onChange={e=>{
                                const v = e.target.checked
                                if (i >= 0) onChangeEntry(i, 'value', v)
                                else setEntries(prev => [...prev, { key: m.key, value: v, masked: !!m.sensitive }])
                              }}
                            />
                            <span>{(String(cur.value).toLowerCase() === 'true' || cur.value === true || cur.value === '1') ? '启用' : '禁用'}</span>
                          </label>
                        ) : m.type === 'int' ? (
                          <input
                            type="number"
                            className="rr-input flex-1"
                            placeholder={placeholder}
                            value={String(cur.value || '')}
                            onChange={e=>{
                              const v = e.target.value
                              if (i >= 0) onChangeEntry(i, 'value', v)
                              else setEntries(prev => [...prev, { key: m.key, value: v, masked: !!m.sensitive }])
                            }}
                          />
                        ) : m.type === 'multiline' ? (
                          <textarea
                            className={"rr-input flex-1 min-h-20 " + (cur.masked ? 'placeholder:italic' : '')}
                            placeholder={placeholder}
                            value={cur.value}
                            onChange={e=>{
                              if (i >= 0) onChangeEntry(i, 'value', e.target.value)
                              else setEntries(prev => [...prev, { key: m.key, value: e.target.value, masked: !!m.sensitive }])
                            }}
                          />
                        ) : (
                          <input
                            className={"rr-input flex-1 " + (cur.masked ? 'placeholder:italic' : '')}
                            placeholder={placeholder}
                            value={cur.value}
                            onChange={e=>{
                              if (i >= 0) onChangeEntry(i, 'value', e.target.value)
                              else setEntries(prev => [...prev, { key: m.key, value: e.target.value, masked: !!m.sensitive }])
                            }}
                          />
                        )}
                        {m.type === 'enum' && (
                          <select className="rr-input flex-1" value={String(cur.value || m.enum?.[0] || '')} onChange={e=>{
                            const v = e.target.value
                            if (i >= 0) onChangeEntry(i, 'value', v)
                            else setEntries(prev => [...prev, { key: m.key, value: v, masked: !!m.sensitive }])
                          }}>
                            {(m.enum || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {(cur.masked || m.sensitive) && (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">敏感</span>
                        )}
                        {cur.configured && (
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">已配置</span>
                        )}
                        </div>
                        {m.desc && <div className="text-xs text-gray-500">{m.desc}</div>}
                        {errs[m.key] && <div className="text-xs text-red-600">{errs[m.key]}</div>}
                      </div>
                      <div className="md:col-span-2 text-right">
                        {i >= 0 && (
                          <button className="text-red-600 text-sm hover:underline" onClick={()=>onRemoveEntry(i)}>清空</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))
        )}

        {/* Unknown or custom keys */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">自定义/未识别</div>
            <Button variant="outline" onClick={onAddEntry}>添加一项</Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {entries.filter(e => !meta.find(m => m.key === e.key)).map((it, idx) => {
              const realIdx = entries.findIndex(e => e.key === it.key)
              return (
                <div key={it.key + '_' + idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <input className="rr-input md:col-span-3" placeholder="key（例如 MY_SETTING_KEY）" value={it.key} onChange={e=>onChangeEntry(realIdx, 'key', e.target.value)} />
                  <div className="md:col-span-7 flex items-center gap-2">
                    <input className="rr-input flex-1" placeholder="value" value={it.value} onChange={e=>onChangeEntry(realIdx, 'value', e.target.value)} />
                  </div>
                  <div className="md:col-span-2 text-right">
                    <button className="text-red-600 text-sm hover:underline" onClick={()=>onRemoveEntry(realIdx)}>删除</button>
                  </div>
                </div>
              )
            })}
            {entries.filter(e => !meta.find(m => m.key === e.key)).length === 0 && (
              <div className="text-sm text-gray-500">暂无自定义项。</div>
            )}
          </div>
          <div className="mt-4 flex items-center">
            <Button color="blue" disabled={loading} onClick={onSave}>{loading ? '保存中…' : '保存所有'}</Button>
            {message && <span className="ml-3 text-sm text-gray-700">{message}</span>}
            {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
          </div>
        </Card>
      </div>
    </Container>
  )
}
