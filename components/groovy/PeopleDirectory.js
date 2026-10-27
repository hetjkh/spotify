import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Mic } from 'lucide-react'
import { useRouter } from 'next/router'
import { api, avatarUrl, fileUrl } from '@/lib/api'
import { CollectionTools, FilteredBooks, NoResults } from './WorkspaceUI'

export default function PeopleDirectory() {
  const router = useRouter()
  const [books, setBooks] = useState([])
  const [curators, setCurators] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([api('/books/public'),api('/books/authors')]).then(([catalog, people]) => { if (active) { setBooks(catalog.books); setCurators(people.authors) } }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])
  const author = router.query.author
  const narrator = router.query.narrator
  const curator = curators.find(item => String(item.id) === String(router.query.artist))
  const name = author || narrator || curator?.name
  if (name) {
    const selected = books.filter(book => author ? book.authorName === author : narrator ? book.narrator === narrator : curator.books.some(item => item.id === book.id))
    const spotlight = selected[0]
    return <div className="people-directory"><Link className="back-link" href="/browse?tab=people">All authors and narrators</Link><header className="channel-stage">{spotlight?.coverUrl && <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(spotlight.coverUrl)})` }} />}<div className="page-intro"><span className="eyebrow">{author ? 'AUTHOR' : narrator ? 'NARRATOR' : curator?.isDemo ? 'FICTIONAL DEMO CURATOR' : 'CREATOR PROFILE'}</span><h1>{name}</h1><p>{curator ? (curator.isDemo ? 'A fictional demo profile that curates recordings. This profile is separate from the author and narrator credits.' : 'A creator who publishes audiobooks. Author and narrator credits are listed on each book.') : `Explore audiobook recordings ${author ? 'written' : 'narrated'} by ${name}.`}</p>{curator && <Link className="button button-quiet" href={`/u/${curator.id}`}>View curator profile</Link>}</div></header><FilteredBooks books={selected} /></div>
  }
  const people = field => [...new Set(books.map(book => book[field]).filter(Boolean))].filter(name => name.toLowerCase().includes(query.toLowerCase())).sort()
  const authors = people('authorName'), narrators = people('narrator')
  const credit = (label, count, unit) => `${count} ${count === 1 ? unit : unit + 's'}`
  return <div className="people-directory"><header className="channel-stage"><div className="page-intro"><span className="eyebrow">THE VOICES AND STORIES</span><h1>Authors &amp; narrators</h1><p>Discover the writers behind each book and the voices reading them.</p></div></header><CollectionTools query={query} onQuery={setQuery} count={authors.length+narrators.length} placeholder="Search authors and narrators..." />{error && <p role="alert">{error}</p>}<section><h2><BookOpen size={22} />Authors</h2><div className="people-stage">{authors.map(name => { const count = books.filter(book => book.authorName === name).length; return <Link className="person-tile" key={name} href={`/browse?tab=people&author=${encodeURIComponent(name)}`}><span className="person-mark" aria-hidden="true">{name[0]}</span><strong>{name}</strong><small>{credit(name, count, 'book')}</small></Link> })}</div></section><section><h2><Mic size={22} />Narrators</h2><div className="people-stage">{narrators.map(name => { const count = books.filter(book => book.narrator === name).length; return <Link className="person-tile" key={name} href={`/browse?tab=people&narrator=${encodeURIComponent(name)}`}><span className="person-mark" aria-hidden="true">{name[0]}</span><strong>{name}</strong><small>{credit(name, count, 'recording')}</small></Link> })}</div></section>{!authors.length && !narrators.length && <NoResults clear={() => setQuery('')} />}<section className="demo-curator-section" id="demo-curators"><h2>Demo curators</h2><p className="muted">Fictional profiles for demonstrating uploads and follows. These portraits do not represent the credited authors or narrators.</p><div className="people-stage">{curators.filter(item => item.isDemo && item.name.toLowerCase().includes(query.toLowerCase())).map(person => <Link key={person.id} href={`/u/${person.id}`} className="person-tile"><img className="person-portrait" src={avatarUrl(person.image)} alt="" /><strong>{person.name}</strong><small>Fictional demo curator</small></Link>)}</div></section></div>
}
