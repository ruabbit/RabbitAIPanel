import React from 'react'
import AppFrame from '../../components/AppFrame'

export default function UserLayout({ children }) {
  const items = [
    { label: '概览', to: '/dashboard/overview', icon: 'home' },
    { label: '账期汇总', to: '/dashboard/period', icon: 'docs' },
    { label: '每日汇总', to: '/dashboard/daily', icon: 'calendar' },
    { label: '近N日汇总', to: '/dashboard/summary', icon: 'reports' },
    { label: '透支/溢出', to: '/dashboard/overdraft', icon: 'reports' },
    { label: '钱包', to: '/dashboard/wallets', icon: 'folder' },
    { label: '流水', to: '/dashboard/ledger', icon: 'docs' },
    { label: '代理测试', to: '/dashboard/proxy', icon: 'users' },
    { label: '购买/充值', to: '/dashboard/purchase', icon: 'docs' },
  ]
  return (
    <AppFrame title="用户后台" items={items}>{children}</AppFrame>
  )
}
