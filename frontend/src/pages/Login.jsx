import React, { useState } from 'react'
import Container from '../primer/Container'
import Card from '../primer/Card'
import Button from '../primer/Button'
import { startSocialLogin } from '../utils/api'
import { isDebug } from '../utils/dev'

export default function Login() {
  const debug = isDebug()
  const [err, setErr] = useState('')

  async function onLogin() {
    setErr('')
    try {
      const r = await startSocialLogin('google')
      if (r.redirect_to) window.location.href = r.redirect_to
      else throw new Error('unexpected')
    } catch (e) {
      if (debug) return // 在 Debug 下交给演示流程
      setErr('当前不可用，请稍后再试')
    }
  }

  return (
    <Container size="sm">
      <div className="mt-10 space-y-4">
        <div className="text-xl font-semibold text-gray-800">登录</div>
        <Card>
          <div className="space-y-3">
            <Button color="blue" onClick={onLogin}>使用社交登录</Button>
            {err && <div className="text-sm text-red-600">{err}</div>}
            {debug && (
              <div className="text-xs text-gray-600">
                仅演示（Debug）：此环境未接入真实登录，点击“使用社交登录”会跳转失败。您可以通过“配置”设置 Dev API Key 与用户 ID 以体验后台功能。
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  )
}

