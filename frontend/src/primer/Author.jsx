import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

export default function Author() {
  return (
    <section id="author" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="05">Author</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
          <div className="rounded-3xl bg-blue-50 aspect-square" />
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">RabbitRelay 团队</h3>
            <p className="mt-3 text-slate-600">我们专注于为开发者与团队提供稳定、安全、优惠的 AI 开发工具访问体验。</p>
            <p className="mt-2 text-slate-600">坚持使用官方原版安装包，仅做网络层优化，不做任何其他处理；尊重用户隐私，本地优先、最小权限。</p>
            <div className="mt-5 flex gap-3 text-sm">
              <a className="text-blue-600 hover:text-blue-800" href="/dashboard">User Console →</a>
              <a className="text-slate-700 hover:text-slate-900" href="/admin">Admin Console →</a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
