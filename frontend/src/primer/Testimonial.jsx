import React from 'react'

export default function Testimonial({ id, author, children }) {
  return (
    <section id={id} className="py-12">
      <figure className="mx-auto max-w-2xl text-center">
        <blockquote className="text-xl text-slate-900 font-medium">{children}</blockquote>
        <figcaption className="mt-3 text-sm text-slate-600">
          <strong className="font-semibold text-blue-600">{author?.name}</strong>
          {author?.role ? <span className="text-slate-500"> · {author.role}</span> : null}
        </figcaption>
      </figure>
    </section>
  )
}

