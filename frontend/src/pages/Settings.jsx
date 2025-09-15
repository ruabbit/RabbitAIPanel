import React, { useEffect, useState } from 'react'
import Container from '../primer/Container'
import Card from '../primer/Card'
import Button from '../primer/Button'
import { getMe, updateMe, startSocialLogin } from '../utils/api'
import { isDebug } from '../utils/dev'

export default function Settings() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const debug = isDebug()

  useEffect(()=>{
    (async () => {
      try { const r = await getMe(); setName(r.me?.name || ''); setEmail(r.me?.email || '') }
      catch (e) { const msg = String(e?.message || e || ''); if (msg.includes('not_logged_in')) { window.location.href = '/' } }
    })()
  }, [])

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">个人设置</div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="rr-label" htmlFor="st-name">姓名</label>
              <input id="st-name" className="rr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="你的名字" />
            </div>
            <div>
              <label className="rr-label" htmlFor="st-email">邮箱</label>
              <input id="st-email" className="rr-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="你的邮箱" />
            </div>
          </div>
          <div className="mt-4">
            <Button color="blue" onClick={async ()=>{ try { setMsg(''); await updateMe({ name, email }); setMsg('已保存') } catch(e){ setMsg(String(e)) } }}>保存</Button>
            {msg && <span className="ml-3 text-sm text-gray-700">{msg}</span>}
          </div>
        </Card>

        <Card>
          <div className="font-semibold mb-2">社交绑定</div>
          {!debug && (
            <div className="text-sm text-gray-600">当前未接入 Logto 配置或非 Debug 模式。社交绑定功能待接入后启用。</div>
          )}
          {debug && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={async ()=>{ try{ const r = await startSocialLogin('google'); if (r.redirect_to) window.location.href = r.redirect_to } catch(e){ alert(String(e)) } }}>绑定 Google</Button>
              <Button variant="outline" onClick={async ()=>{ try{ const r = await startSocialLogin('github'); if (r.redirect_to) window.location.href = r.redirect_to } catch(e){ alert(String(e)) } }}>绑定 GitHub</Button>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">说明：社交绑定需要后端正确配置 Logto（LOGTO_* 环境变量）。当前按钮用于调试跳转。</div>
        </Card>
      </div>
    </Container>
  )
}
