import React from 'react'
import CheckIcon from './CheckIcon'
import Container from './Container'

export default function Introduction() {
  return (
    <section id="introduction" aria-label="Introduction" className="pt-20 pb-16 sm:pb-20 md:pt-36 lg:py-32">
      <Container className="text-lg tracking-tight text-slate-700">
        <p className="font-display text-4xl font-bold tracking-tight text-slate-900">
          官方原版安装包 · 仅优化网络 · 与官网一致的使用体验
        </p>
        <p className="mt-4">RabbitRelay 致力于为开发者和团队提供稳定、安全、优惠的 AI 开发工具访问体验。</p>
        <p className="mt-4">我们不改动应用本身，不做任何注入/破解/二次打包，只在网络层做智能优化。</p>
        <ul role="list" className="mt-8 space-y-3">
          {[
            '官方原版安装包：零修改、零注入、零破解',
            '智能网络优化：多线路自动择优，断流秒级切换',
            '一致体验：登录、升级、插件与直连官网完全一致',
            '隐私安全：不读取代码、不收集日志、本地优先',
            '价格友好：更优惠的网络成本，让开发更轻松',
          ].map((feature) => (
            <li key={feature} className="flex">
              <CheckIcon className="h-8 w-8 flex-none text-blue-500" />
              <span className="ml-4">{feature}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8">支持 Claude Code、Codex、Gemini CLI、Gork Code 等主流工具，开箱即用。</p>
      </Container>
    </section>
  )
}
