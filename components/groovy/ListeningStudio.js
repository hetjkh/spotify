import Link from 'next/link'
import { ArrowUpRight, BookOpen, Sparkles } from 'lucide-react'
import { fileUrl } from '@/lib/api'

export function StudioHeading({ eyebrow, title, description, children }) {
  return <div className="studio-section-heading"><div><span className="studio-eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</div>
}

export function StudioHero({ kind, name, books = [], count = 0, children }) {
  return <header className={`studio-hero studio-hero-${kind}`}><div className="studio-hero-copy"><span className="studio-eyebrow"><Sparkles size={13} />{kind === 'dashboard' ? 'A LITTLE TIME, A GOOD STORY' : 'YOUR PERSONAL BOOKSHELF'}</span><h1>{kind === 'dashboard' ? <>Make room<br />for a good story.</> : <>A shelf full<br />of possibilities.</>}</h1><p>{kind === 'dashboard' ? `Welcome back, ${name}. Your next chapter is right where you left it.` : `${count} ${count === 1 ? 'story' : 'stories'} to get lost in. Keep your favorites close and your next listen closer.`}</p><div className="studio-hero-actions">{children}<Link className="studio-link" href={kind === 'dashboard' ? '/library' : '/browse'}>{kind === 'dashboard' ? 'Explore my library' : 'Discover something new'}<ArrowUpRight size={16} /></Link></div></div><div className="studio-hero-art" aria-hidden="true"><span className="studio-orbit orbit-one" /><span className="studio-orbit orbit-two" /><span className="studio-art-caption">ONE MORE CHAPTER</span>{books.length ? <div className="studio-book-fan">{books.slice(0,3).map((book,index) => <img key={book.id} src={fileUrl(book.coverUrl)} alt="" style={{'--book-order':index}} />)}</div> : <div className="studio-empty-art"><BookOpen size={72} strokeWidth={1} /></div>}<span className="studio-stamp">press play.<br /><strong>stay awhile.</strong></span></div></header>
}

export function StudioMetric({ value, label, hint, icon: Icon, tone = 'sage' }) {
  return <div className={`studio-metric metric-${tone}`}><span className="studio-metric-icon"><Icon size={19} /></span><strong>{value}</strong><span>{label}</span>{hint && <small>{hint}</small>}</div>
}
