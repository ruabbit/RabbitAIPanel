import React from 'react'
import AppFrame from '../../components/AppFrame'

export default function AdminLayout({ children }) {
  const items = [
    { label: '计划-创建', to: '/admin/plan/create', icon: 'folder' },
    { label: '计划-日限额', to: '/admin/plan/daily', icon: 'calendar' },
    { label: '计划-用量', to: '/admin/plan/usage', icon: 'reports' },
    { label: '计划-计价规则', to: '/admin/plan/pricerule', icon: 'docs' },
    { label: '计划-分配', to: '/admin/plan/assign', icon: 'users' },
    { label: '计划-详情', to: '/admin/plan/detail', icon: 'docs' },
    { label: '价格映射', to: '/admin/price-mappings', icon: 'docs' },
    { label: '客户', to: '/admin/customers', icon: 'users' },
    { label: '订阅', to: '/admin/subscriptions', icon: 'folder' },
    { label: '发票', to: '/admin/invoices', icon: 'docs' },
    { label: 'Stripe Ensure', to: '/admin/stripe-ensure', icon: 'settings' },
    { label: '团队账期', to: '/admin/team-period', icon: 'reports' },
  ]
  return (
    <AppFrame title="管理后台" items={items}>{children}</AppFrame>
  )
}
