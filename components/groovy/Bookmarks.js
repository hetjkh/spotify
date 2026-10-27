import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Pencil, Play, Trash2 } from 'lucide-react'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { formatTime } from '@/data/groovy'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'
import { CollectionTools, NoResults } from './WorkspaceUI'
import { Modal } from './UI'

export default function Bookmarks() {
  const { user, ready } = useAuth()
  const music = useMusic()
  const [marks, setMarks] = useState([])
  const [books, setBooks] = useState({})
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [note, setNote] = useState('')
  const load = async () => {
    if (!user) return
    try {
      const data = await api('/bookmarks')
      const ids = [...new Set(data.bookmarks.map(mark => mark.book))]
      const entries = await Promise.all(ids.map(id => api(`/books/${id}`).then(data => [id, data.book])))
      setMarks(data.bookmarks); setBooks(Object.fromEntries(entries)); setError('')
    } catch (err) { setError(err.message) }
  }
  useEffect(() => { load(); window.addEventListener('groovy:bookmarks', load); return () => window.removeEventListener('groovy:bookmarks', load) }, [user?.id])
  const act = async fn => { try { await fn(); await load(); window.dispatchEvent(new Event('groovy:bookmarks-updated')) } catch (err) { setError(err.message) } }
  const filtered = marks.filter(mark => `${books[mark.book]?.title} ${mark.chapterTitle} ${mark.note}`.toLowerCase().includes(query.toLowerCase()))
  if (!ready) return <p>Loading bookmarks...</p>
  return <div className="bookmarks-page"><div className="page-intro"><span className="eyebrow">KEEP THE MOMENTS THAT MATTER</span><div><h1>Your bookmarks</h1><Bookmark size={30} /></div><p>Jump back to a passage, add a note, or clear a moment you no longer need.</p></div>{!user ? <Link className="button button-primary" href="/login">Sign in to view bookmarks</Link> : <><CollectionTools query={query} onQuery={setQuery} count={filtered.length} placeholder="Search bookmarks, books, and notes..." />{error && <p role="alert" className="form-alert">{error}</p>}<div className="bookmark-grid">{filtered.map(mark => <article className="bookmark-card" key={mark._id}><div className="bookmark-book"><img src={fileUrl(books[mark.book]?.coverUrl)} alt="" /><div><Link href={`/listen/${mark.book}`}><h3>{books[mark.book]?.title}</h3></Link><p>{mark.chapterTitle}</p><span className="time-pill">{formatTime(mark.seconds)}</span></div></div><p className="bookmark-note">{mark.note || 'No note yet. Add a thought to remember this moment.'}</p><div className="collection-controls"><button className="button button-primary" onClick={() => { const tracks = toPlayerTracks(books[mark.book]); const track = tracks.find(item => item.id === mark.chapterId); if (track) music.playTrack(track, tracks, mark.seconds) }}><Play size={14} />Jump to moment</button><button className="icon-button" aria-label={`Edit note for ${mark.chapterTitle}`} onClick={() => { setEditing(mark); setNote(mark.note || '') }}><Pencil size={17} /></button><button className="icon-button danger-action" aria-label={`Delete bookmark ${mark.chapterTitle}`} onClick={() => { if (confirm('Delete this bookmark and its note?')) act(() => api(`/bookmarks/${mark._id}`, { method: 'DELETE' })) }}><Trash2 size={17} /></button></div></article>)}</div>{!filtered.length && <NoResults clear={query ? () => setQuery('') : null} />}</>}{editing && <Modal title="Edit bookmark note" onClose={() => setEditing(null)}><form className="note-form" onSubmit={event => { event.preventDefault(); act(async () => { await api(`/bookmarks/${editing._id}`, { method: 'PATCH', body: JSON.stringify({ note }) }); setEditing(null); music.notify('Bookmark note saved') }) }}><label className="field-label" htmlFor="bookmark-note">Your note</label><textarea id="bookmark-note" aria-label="Your note" className="text-field" maxLength={280} rows={4} value={note} onChange={event => setNote(event.target.value)} /><small>{note.length}/280 characters</small><button className="button button-primary" type="submit">Save note</button></form></Modal>}</div>
}
