import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDownAZ, ArrowRight, BookOpen, Grid2X2, Headphones, LayoutList, Pause, Play, Search, X } from 'lucide-react'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'
import { BookActions, matches, NoResults } from './WorkspaceUI'

function CatalogBook({ book }) {
  const music = useMusic()
  const playing = String(music.current.bookId) === String(book.id) && music.playing
  return <article className="workspace-book-card browse-book">
    <div className="browse-book-art">
      <Link href={`/listen/${book.id}`} aria-label={`Open ${book.title}`}><img src={fileUrl(book.coverUrl)} alt={`${book.title} cover`} loading="lazy" /></Link>
      <button type="button" className="browse-quick-play" aria-label={`${playing ? 'Pause' : 'Play'} ${book.title}`} onClick={() => playing ? music.togglePlay() : music.playBook(book.id)}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
    </div>
    <div className="browse-book-body">
      <Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link>
      <p>{book.authorName}</p>
      <span className="browse-book-format">{book.genre}</span>
      <small>{book.chapters?.length || 0} chapters{book.narrator && <span>Read by {book.narrator}</span>}</small>
      <BookActions book={book} />
    </div>
  </article>
}

export default function BrowseCatalog() {
  const music = useMusic()
  const { user } = useAuth()
  const searchRef = useRef(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('default')
  const [view, setView] = useState('grid')
  const [expanded, setExpanded] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api('/books/public').then(data => { if (active) setBooks(data.books || []) })
      .catch(() => { if (active) setError('We could not load the books. Please try again in a moment.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [request])
  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])
  const categories = [...new Set(books.map(book => book.genre).filter(Boolean))].sort()
  const filtered = books.filter(book => matches(book, query) && (!genre || book.genre === genre)).sort((a, b) =>
    sort === 'title' ? a.title.localeCompare(b.title) : sort === 'author' ? (a.authorName || '').localeCompare(b.authorName || '') : sort === 'plays' ? (b.plays || 0) - (a.plays || 0) : 0)
  const recent = music.getTracksByIds(music.history).find(track => books.some(book => String(book.id) === String(track.bookId)))
  const nextBook = books.find(book => String(book.id) === String(recent?.bookId)) || books[0]
  const activeBook = nextBook && String(music.current.bookId) === String(nextBook.id)
  const nextPlaying = activeBook && music.playing
  const seconds = recent ? (activeBook && music.current.id === recent.id ? music.time : music.progress[recent.id] || 0) : 0
  const duration = recent ? (activeBook && music.current.id === recent.id ? music.duration : recent.duration) : 0
  const percent = duration > 0 ? Math.min(100, Math.round(seconds / duration * 100)) : 0
  const playNext = () => {
    if (nextPlaying) music.togglePlay()
    else if (recent) music.playTrack(recent, toPlayerTracks(nextBook), seconds)
    else if (nextBook) music.playBook(nextBook.id)
  }
  const clear = () => { setQuery(''); setGenre(''); setSort('default') }

  return <div className="browse-catalog">
    <header className="browse-heading"><div><h1>{user ? `Hello, ${user.name?.split(' ')[0] || 'listener'}` : 'Hello, book lover.'}</h1><p>{user ? 'Welcome back. Find your next listen.' : 'A little time. A good book. Your next escape.'}</p></div><button type="button" className="browse-search-toggle" aria-label="Search the catalog" aria-expanded={searchOpen} aria-controls="browse-catalog-tools" onClick={() => setSearchOpen(value => !value)}>{searchOpen ? <X size={21} /> : <Search size={21} />}</button></header>
    <section id="browse-books" className="browse-collection" aria-labelledby="browse-collection-title">
      <div className="browse-section-heading"><h2 id="browse-collection-title">{expanded ? 'All books' : 'For you'}<span aria-live="polite">{loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'book' : 'books'}`}</span></h2><div className="browse-section-actions"><button type="button" className="browse-see-all" onClick={() => { setExpanded(value => !value); setView('grid') }}>{expanded ? 'Show shelf' : 'See all'}<ArrowRight size={16} /></button><div className="browse-view-switch" role="group" aria-label="Catalog view"><button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={16} /></button><button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => { setView('list'); setExpanded(true) }}><LayoutList size={17} /></button></div></div></div>
      <div className="browse-genre-pills" role="group" aria-label="Browse by genre">{['', ...categories].map(name => <button key={name} type="button" aria-pressed={genre === name} onClick={() => setGenre(name)}>{name || 'All books'}</button>)}</div>
      <div id="browse-catalog-tools" className={`browse-toolbar ${searchOpen ? 'is-open' : ''}`}><label className="browse-search"><Search size={17} /><input ref={searchRef} aria-label="Search titles, authors, narrators..." placeholder="Search books, authors, narrators..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear catalog search" onClick={() => setQuery('')}><X size={16} /></button>}</label><label className="browse-sort"><ArrowDownAZ size={17} /><select aria-label="Sort results" value={sort} onChange={event => setSort(event.target.value)}><option value="default">Recommended</option><option value="title">Title A-Z</option><option value="author">Author A-Z</option><option value="plays">Most played</option></select></label></div>
      {error ? <div className="browse-state" role="alert"><BookOpen size={28} /><h3>The collection is taking a moment.</h3><p>{error}</p><button type="button" className="button button-quiet" onClick={() => setRequest(value => value + 1)}>Try again</button></div> : loading ? <div className="browse-book-grid" aria-label="Loading books" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="browse-skeleton" aria-hidden="true"><div /><span /><span /></div>)}</div> : books.length === 0 ? <div className="browse-state"><BookOpen size={30} /><h3>A new chapter is on its way.</h3><p>Published audiobooks will appear here. Check back soon.</p></div> : <><div className={`browse-book-grid ${expanded ? 'is-expanded' : ''} ${view === 'list' ? 'is-list-view' : ''}`}>{filtered.map(book => <CatalogBook key={book.id} book={book} />)}</div>{!filtered.length && <NoResults clear={clear} />}</>}
    </section>
    {nextBook && <section className="browse-next" aria-labelledby="browse-next-title"><div className="browse-section-heading"><h2 id="browse-next-title">{recent ? 'Continue listening' : 'Start with a classic'}</h2><Link href={recent ? '/library?status=in_progress' : `/listen/${nextBook.id}`} className="browse-see-all">{recent ? 'My library' : 'Book details'}<ArrowRight size={16} /></Link></div><article className="browse-resume-card"><div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(nextBook.coverUrl)})` }} /><Link href={`/listen/${nextBook.id}`} className="browse-resume-cover"><img src={fileUrl(nextBook.coverUrl)} alt={`${nextBook.title} cover`} /></Link><div className="browse-resume-copy"><span>{recent ? 'RIGHT WHERE YOU LEFT OFF' : 'READY WHEN YOU ARE'}</span><Link href={`/listen/${nextBook.id}`}><h3>{nextBook.title}</h3></Link><p>{nextBook.authorName}</p>{recent ? <><div className="browse-progress-label"><span>Chapter progress</span><strong>{percent}%</strong></div><progress aria-label="Chapter progress" max="100" value={percent} /></> : <small><Headphones size={13} />{nextBook.chapters?.length || 0} chapters<span>&middot;</span>{nextBook.genre}</small>}</div><button type="button" className="browse-resume-play" aria-label={`${nextPlaying ? 'Pause' : recent ? 'Resume' : 'Play'} ${nextBook.title}`} onClick={playNext}>{nextPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button></article></section>}
    <footer className="browse-footer"><span><Headphones size={15} />Your next chapter is a play away.</span><Link href="/browse?tab=categories">Explore categories<ArrowRight size={14} /></Link><small>Demo catalog &middot; LibriVox audio excerpts</small></footer>
  </div>
}
