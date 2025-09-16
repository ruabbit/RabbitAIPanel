import React from 'react'
import AppFrame from '../../components/AppFrame'
import { useEffect } from 'react'
import { adminPing } from '../../utils/api'
import { isDebug } from '../../utils/dev'

export default function AdminLayout({ children }) {
  useEffect(() => {
    let mounted = true
    ;(async ()=>{
      try {
        await adminPing()
      } catch (e) {
        // If debug mode, we may still have access, but admin_auth may be required in prod
        if (!isDebug()) {
          if (mounted) window.location.href = '/admin/login'
        }
      }
    })()
    return ()=>{ mounted = false }
  }, [])
  const items = [
    { label: '计划', to: '/admin/plans', icon: 'folder' },
    { label: '客户', to: '/admin/customers', icon: 'users' },
    { label: '订阅', to: '/admin/subscriptions', icon: 'folder' },
    { label: '发票', to: '/admin/invoices', icon: 'docs' },
    { label: '团队', to: '/admin/teams', icon: 'users' },
  ]
  return (
    <AppFrame title="管理后台" items={items} settingsTo="/admin/settings">{children}</AppFrame>
  )
}
