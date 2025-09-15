import React from 'react'
import AppFrame from '../../components/AppFrame'

export default function AdminLayout({ children }) {
  const items = [
    { label: '计划', to: '/admin/plans', icon: 'folder' },
    { label: '客户', to: '/admin/customers', icon: 'users' },
    { label: '订阅', to: '/admin/subscriptions', icon: 'folder' },
    { label: '发票', to: '/admin/invoices', icon: 'docs' },
    { label: '团队账期', to: '/admin/team-period', icon: 'reports' },
  ]
  return (
    <AppFrame title="管理后台" items={items}>{children}</AppFrame>
  )
}
