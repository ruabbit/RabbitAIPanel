import React, { useState } from 'react'
import Container from '../../primer/Container'
import Card from '../../primer/Card'
import Button from '../../primer/Button'
import { adminPing } from '../../utils/api'

export default function AdminLogin() {
  const [token, setToken] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  async function onLogin() {
    setErr(''); setOk(false)
    try {
      localStorage.setItem('admin_auth_token', token)
      await adminPing()
      setOk(true)
      window.location.href = '/admin'
    } catch (e) {
      localStorage.removeItem('admin_auth_token')
      setErr('登录失败，请稍后再试')
    }
  }

  return (
    <Container size="sm">
      <div className="mt-10 space-y-4">
        <div className="text-xl font-semibold text-gray-800">管理后台登录</div>
        <Card>
          <div className="space-y-3">
            <input className="rr-input w-full" placeholder="管理员令牌" value={token} onChange={e=>setToken(e.target.value)} />
            <Button color="blue" onClick={onLogin}>登录</Button>
            {err && <div className="text-sm text-red-600">{err}</div>}
            {ok && <div className="text-sm text-green-700">登录成功，正在跳转…</div>}
            <div className="text-xs text-gray-600">说明：生产模式下暂以请求头令牌校验通过后进入管理后台。</div>
          </div>
        </Card>
      </div>
    </Container>
  )
}

