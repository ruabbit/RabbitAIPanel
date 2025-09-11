import React from 'react'
import Sidebar from '../../components/Sidebar'

export default function AdminLayout({ children }) {
  const items = [
    { label: '计划-创建', to: '/admin/plan/create' },
    { label: '计划-日限额', to: '/admin/plan/daily' },
    { label: '计划-用量', to: '/admin/plan/usage' },
    { label: '计划-计价规则', to: '/admin/plan/pricerule' },
    { label: '计划-分配', to: '/admin/plan/assign' },
    { label: '计划-详情', to: '/admin/plan/detail' },
    { label: '价格映射', to: '/admin/price-mappings' },
    { label: '客户', to: '/admin/customers' },
    { label: '订阅', to: '/admin/subscriptions' },
    { label: '发票', to: '/admin/invoices' },
    { label: 'Stripe Ensure', to: '/admin/stripe-ensure' },
    { label: '团队账期', to: '/admin/team-period' },
  ]
  return (
    <div className="min-h-[70vh] grid grid-cols-[16rem_1fr] gap-0">
      <Sidebar items={items} title="管理后台" />
      <div className="p-6">{children}</div>
    </div>
  )
}

