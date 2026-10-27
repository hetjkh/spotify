import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Check, Heart, Play, Search, X } from 'lucide-react'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'

export const matches = (item, query) => `${item.title || item.name || ''} ${item.authorName || item.artist || ''} ${item.genre || ''} ${item.narrator || ''} ${item.album || ''}`.toLowerCase().includes(query.trim().toLowerCase())

export function CollectionTools({ query, onQuery, genre, onGenre, genres = [], sort, onSort, count, placeholder = 'Search titles, authors, narrators...' }) {
  return <div className="collection-toolbar"><label className="collection-search"><Search size={18} /><input aria-label={placeholder} placeholder={placeholder} value={query} onChange={event => onQuery(event.target.value)} />{query && <button type="button" aria-label="Clear collection search" onClick={() => onQuery('')}><X size={16} /></button>}</label>{onGenre && <label className="toolbar-select"><span>Genre</span><select aria-label="Filter by genre" value={genre} onChange={event => onGenre(event.target.value)}><option value="">All genres</option>{genres.map(name => <option key={name}>{name}</option>)}</select></label>}{onSort && <label className="toolbar-select"><span>Sort by</span><select aria-label="Sort results" value={sort} onChange={event => onSort(event.target.value)}><option value="default">Default order</option><option value="title">Title A–Z</option><option value="author">Author A–Z</option><option value="plays">Most played</option></select></label>}{count != null && <span className="result-count" role="status">{count} {count === 1 ? 'result' : 'results'}</span>}</div>
}

export function NoResults({ clear }) {
  return <div className="collection-empty"><Search size={28} /><h3>No matching results</h3><p>Try another title or clear your filters.</p>{clear && <button className="button button-quiet" onClick={clear}>Clear filters</button>}</div>
}

export function BookActions({ book }) {
  const { user } = useAuth()
  const music = useMusic()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    const load = () => { if (user) api('/library').then(data => { if (active) setSaved(data.items.some(item => item.book.id === book.id)) }).catch(() => {}); else setSaved(false) }
    load(); window.addEventListener('groovy:library', load)
    return () => { active = false; window.removeEventListener('groovy:library', load) }
  }, [user?.id, book.id])
  const tracks = toPlayerTracks(book)
  const liked = tracks.length > 0 && tracks.every(track => music.liked.includes(track.id))
  const save = async () => {
    if (!user) { music.notify('Sign in to save books to your library'); return }
    setBusy(true)
    try { await api(saved ? `/library/${book.id}` : '/library', { method: saved ? 'DELETE' : 'POST', ...(!saved && { body: JSON.stringify({ bookId: book.id, status: 'wishlist' }) }) }); setSaved(!saved); music.notify(saved ? 'Removed from your library' : 'Added to Want to listen'); window.dispatchEvent(new Event('groovy:library')) } catch (err) { music.notify(err.message) } finally { setBusy(false) }
  }
  return <div className="book-action-bar"><button className="button button-primary" onClick={() => music.playBook(book.id)}><Play size={15} fill="currentColor" />Listen</button><button className={`icon-button ${saved ? 'action-selected' : ''}`} title={saved ? 'Remove whole book from My Library' : 'Add whole book to Want to listen'} aria-label={`${saved ? 'Remove from library:' : 'Want to listen:'} ${book.title}`} aria-pressed={saved} disabled={busy} onClick={save}>{saved ? <Check size={18} /> : <Bookmark size={18} />}</button><button className={`icon-button ${liked ? 'action-selected' : ''}`} title={liked ? 'Unlike all chapters in this book' : 'Like all chapters in this book'} aria-label={`${liked ? 'Unlike chapters in' : 'Like chapters in'} ${book.title}`} aria-pressed={liked} onClick={() => { tracks.forEach(track => { if (liked || !music.liked.includes(track.id)) music.toggleTrackLike(track) }); music.notify(liked ? 'Chapters removed from likes' : 'Chapters added to likes') }}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button></div>
}

export function WorkspaceBookCard({ book }) {
  return <article className="workspace-book-card"><Link className="workspace-cover" href={`/listen/${book.id}`}><img src={fileUrl(book.coverUrl)} alt={`${book.title} cover`} loading="lazy" /><span className="genre-pill">{book.genre}</span></Link><div className="workspace-book-body"><Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link><p>{book.authorName}</p><small>{book.chapters?.length || 0} chapters{book.narrator ? ` · ${book.narrator}` : ''}</small><BookActions book={book} /></div></article>
}

export function FilteredBooks({ books }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('default')
  const filtered = books.filter(book => matches(book, query) && (!genre || genre === book.genre)).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'author' ? a.authorName.localeCompare(b.authorName) : sort === 'plays' ? b.plays - a.plays : 0)
  return <><CollectionTools query={query} onQuery={setQuery} genre={genre} onGenre={setGenre} genres={[...new Set(books.map(book => book.genre))].sort()} sort={sort} onSort={setSort} count={filtered.length} /><div className="workspace-book-grid">{filtered.map(book => <WorkspaceBookCard key={book.id} book={book} />)}</div>{!filtered.length && <NoResults clear={() => { setQuery(''); setGenre('') }} />}</>
}
