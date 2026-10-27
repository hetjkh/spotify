import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'
import { CollectionTools, NoResults } from './WorkspaceUI'
import { fileUrl } from '@/lib/api'
import { readDownloads, removeDownload } from '@/lib/offline'
export default function Downloads({ compact = false }) {
  const { user } = useAuth()
  const music = useMusic()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { const load = () => setItems(readDownloads(user?.id)); load(); window.addEventListener('groovy:downloads', load); return () => window.removeEventListener('groovy:downloads', load) }, [user?.id])
  return <section className="download-list">{compact ? <h2>Downloads</h2> : <div className="page-intro"><span className="eyebrow">TAKE THE STORY WITH YOU</span><h1>Your downloads.</h1><p>Saved audio stays on this browser until you remove it or clear browser storage.</p></div>}<p className="muted">{items.length} books · {(items.reduce((n, item) => n + item.bytes, 0) / 1048576).toFixed(1)} MB used</p>{error && <p role="alert">{error}</p>}{!compact && <CollectionTools query={query} onQuery={setQuery} count={items.filter(item => item.book.title.toLowerCase().includes(query.toLowerCase())).length} placeholder="Search downloaded books..." />}{items.filter(item => item.book.title.toLowerCase().includes(query.toLowerCase())).map(item => <article className="download-row" key={item.book.id}><img className="download-cover" src={fileUrl(item.book.coverUrl)} alt="" /><div><h3>{item.book.title}</h3><p className="muted">Ready offline · {(item.bytes / 1048576).toFixed(1)} MB</p></div><button className="button button-primary" onClick={() => music.playBook(item.book.id)}>Listen offline</button><button className="button button-quiet" onClick={() => removeDownload(user?.id, item.book.id).catch(err => setError(err.message))}>Remove download</button></article>)}{items.length > 0 && query && !items.some(item => item.book.title.toLowerCase().includes(query.toLowerCase())) && <NoResults clear={() => setQuery('')} />}{!items.length && <p className="muted">Use Offline on a book page to save it here.</p>}</section>
}
