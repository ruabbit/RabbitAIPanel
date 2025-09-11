import React from 'react'
import Container from './Container'
import Testimonial from './Testimonial'

const items = [
  { name: '资深开发者', role: '开源社区', q: '官方安装包 + 网络优化，和直连官网一样的体验，升级也很顺畅。' },
  { name: '基础设施负责人', role: '创业团队', q: '线路稳定，价格友好，团队成员在不同地区都能顺利使用。' },
]

export default function Testimonials() {
  return (
    <section className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {items.map((t, i) => (
            <Testimonial key={i} author={{ name: t.name, role: t.role }}>
              <p>“{t.q}”</p>
            </Testimonial>
          ))}
        </div>
      </Container>
    </section>
  )
}
