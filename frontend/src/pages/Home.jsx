import React from 'react'
import { FiZap, FiLock, FiTrendingDown, FiActivity } from 'react-icons/fi'

export default function Home() {
  const features = [
    { icon: <FiZap />, title: 'Claude/ChatGPT API 中转服务', desc: '兼容官方 API 协议，开箱对接。' },
    { icon: <FiLock />, title: '官方 API 直连', desc: '安全稳定，认证鉴权与配额齐备。' },
    { icon: <FiTrendingDown />, title: '成本降低 87%', desc: '多维度计价与降级策略，灵活控制。' },
    { icon: <FiActivity />, title: '可用性 99.99%', desc: '出站/入站事件幂等，故障自动重试。' },
  ]

  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-4xl font-extrabold text-gray-800">AI API 代理与计费一体化</h1>
        <p className="mt-4 text-gray-600">（文案占位）Claude/ChatGPT API 中转服务 · 官方 API 直连 · 成本降低 87% · 可用性 99.99%</p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="/dashboard" className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark">开始使用</a>
          <a href="/admin" className="border px-5 py-2 rounded hover:border-primary hover:text-primary">管理后台</a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, idx) => (
          <div key={idx} className="bg-white rounded shadow p-6">
            <div className="text-primary text-2xl">{f.icon}</div>
            <div className="mt-3 font-semibold text-gray-800">{f.title}</div>
            <div className="mt-2 text-sm text-gray-600">{f.desc}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

