import React from 'react'
import Button from './Button'
import CheckIcon from './CheckIcon'
import Container from './Container'
import GridPattern from './GridPattern'
import SectionHeading from './SectionHeading'

function Plan({ name, description, price, features, href, featured = false }) {
  return (
    <div className={`relative px-4 py-16 sm:rounded-[3rem] sm:px-10 md:py-12 lg:px-12 ${featured ? 'bg-blue-600 sm:shadow-lg' : ''}`}>
      {featured && (
        <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] text-white/10">
          <GridPattern x="50%" y="50%" />
        </div>
      )}
      <div className="relative flex flex-col">
        <h3 className={`mt-7 text-lg font-semibold tracking-tight ${featured ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
        <p className={`mt-2 text-lg tracking-tight ${featured ? 'text-white' : 'text-slate-600'}`}>{description}</p>
        <p className="order-first flex font-display font-bold">
          <span className={`${featured ? 'text-blue-200' : 'text-slate-500'} text-[1.75rem]/9`}>$</span>
          <span className={`${featured ? 'text-white' : 'text-slate-900'} mt-1 ml-1 text-7xl tracking-tight`}>{price}</span>
        </p>
        <div className="order-last mt-8">
          <ul role="list" className={`-my-2 divide-y text-base tracking-tight ${featured ? 'divide-white/10 text-white' : 'divide-slate-200 text-slate-900'}`}>
            {features.map((feature) => (
              <li key={feature} className="flex py-2">
                <CheckIcon className={`h-8 w-8 flex-none ${featured ? 'text-white' : 'text-slate-600'}`} />
                <span className="ml-4">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button href={href} color={featured ? 'white' : 'slate'} className="mt-8" aria-label={`Get started with the ${name} plan for $${price}`}>
          Get started
        </Button>
      </div>
    </div>
  )}

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-14 pt-16 pb-8 sm:scroll-mt-32 sm:pt-20 sm:pb-10 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="04" id="pricing-title">价格</SectionHeading>
        <p className="mt-8 font-display text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">选择适合你的方案</p>
        <p className="mt-4 max-w-xl text-lg tracking-tight text-slate-600">更优惠的网络成本与透明计费，让个人与团队都能轻松使用。</p>
      </Container>
      <div className="mx-auto mt-16 max-w-5xl lg:px-6">
        <div className="grid bg-slate-50 sm:px-6 sm:pb-16 md:grid-cols-2 md:rounded-[3rem] md:px-8 md:pt-16 lg:p-20">
          <Plan name="基础版" description="个人与小团队的理想选择。" price="—" href="#" features={[ '官方原版安装包', '智能网络优化（标准）', '一致使用体验' ]} />
          <Plan featured name="专业版" description="更高可用与更优线路策略。" price="—" href="#" features={[ '官方原版安装包', '智能网络优化（高级）', '多区域线路与自动切换', '更优网络成本' ]} />
        </div>
      </div>
    </section>
  )
}
