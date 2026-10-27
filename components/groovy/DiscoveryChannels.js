import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { genres } from '@/data/groovy'
import { useMusic } from './MusicProvider'
import { BookActions, CollectionTools, matches, NoResults } from './WorkspaceUI'

export default function DiscoveryChannels({ mode, initialSort = 'plays' }) {
  const music = useMusic()
  const [genre, setGenre] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(initialSort)
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api(mode === 'charts' ? `/books/charts?sort=${sort}` : `/books/stations?genre=${encodeURIComponent(genre)}`).then(data => { if (active) { setBooks(data.books); setError('') } }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [mode, genre, sort])
  const filtered = books.filter(book => matches(book, query) && (!genre || book.genre === genre))
  const charts = mode === 'charts'
  const lead = charts ? filtered[0] : null
  const rest = charts ? filtered.slice(1) : filtered
  const title = charts ? (initialSort === 'newest' ? 'New releases' : 'Popular audiobooks') : 'Listening stations'
  return <div className="listening-dashboard channel-page">
    <header className="channel-stage">
      {lead?.coverUrl && <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(lead.coverUrl)})` }} />}
      <div className="page-intro">
        <span className="eyebrow">{charts ? 'FIND YOUR NEXT FAVORITE' : 'LET THE STORIES FLOW'}</span>
        <h1>{title}</h1>
        <p>{charts ? 'Discover the most played, best rated, and newest stories.' : 'Optional discovery: choose a genre and listen to complete books, with chapters in their original order.'}</p>
      </div>
      {!charts && <Radio />}
    </header>
    {error && <p role="alert">{error}</p>}
    <CollectionTools query={query} onQuery={setQuery} genre={genre} onGenre={setGenre} genres={genres.map(item => item.name)} count={filtered.length} />
    {charts ? (initialSort !== 'newest' && <label className="field-label channel-ranking">Rank by<select className="text-field" value={sort} onChange={event => setSort(event.target.value)}><option value="plays">Most played - all time</option><option value="rating">Highest rated</option><option value="newest">Newest releases</option></select></label>) : <button className="button button-primary station-start" disabled={!filtered.length} onClick={() => { const shuffled = [...filtered]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] } const tracks = shuffled.flatMap(toPlayerTracks); music.setShuffle(false); music.setRepeat('off'); if (tracks.length) music.playTrack(tracks[0], tracks, 0) }}><Radio size={17} />Start station</button>}
    {lead && <article className="browse-resume-card channel-lead">
      <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(lead.coverUrl)})` }} />
      <Link className="browse-resume-cover" href={`/listen/${lead.id}`}><img src={fileUrl(lead.coverUrl)} alt="" /></Link>
      <div className="browse-resume-copy">
        <span>01</span>
        <Link href={`/listen/${lead.id}`}><h3>{lead.title}</h3></Link>
        <p>{lead.authorName} · {lead.genre}</p>
        <small>{lead.plays} plays · {lead.ratingCount ? `${lead.rating.toFixed(1)} stars` : 'Not rated yet'}</small>
      </div>
      <BookActions book={lead} />
    </article>}
    {charts ? <div className="channel-shelf">{rest.map((book, index) => <article className="channel-cover" key={book.id}><Link className="channel-cover-art" href={`/listen/${book.id}`}><img src={fileUrl(book.coverUrl)} alt="" /><span className="channel-rank">{String(index + 2).padStart(2, '0')}</span></Link><div className="channel-cover-copy"><Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link><p>{book.authorName}</p><small>{book.plays} plays · {book.genre}</small><BookActions book={book} /></div></article>)}</div> : <div className="ranked-books">{rest.map((book, index) => <article className="ranked-book" key={book.id}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><Link href={`/listen/${book.id}`}><img src={fileUrl(book.coverUrl)} alt="" /></Link><div className="ranked-book-info"><Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link><p>{book.authorName} &middot; {book.genre}</p><small>{book.plays} plays &middot; {book.ratingCount ? `${book.rating.toFixed(1)} stars` : 'Not rated yet'}</small></div><BookActions book={book} /></article>)}</div>}
    {!filtered.length && !error && <NoResults clear={() => { setQuery(''); setGenre('') }} />}
  </div>
}
