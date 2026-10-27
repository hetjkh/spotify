import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Grid2X2, Headphones, LayoutList, Play, Settings2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { CollectionTools, matches, NoResults } from './WorkspaceUI'
import { api, fileUrl } from '@/lib/api'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'

const statusLabels = {in_progress:'Continue listening',finished:'Finished',want_to_listen:'Want to listen'}
const ribbonLabels = {in_progress:'Reading',finished:'Read',want_to_listen:'Next'}
const isWanted = status => ['saved','wishlist','want_to_listen'].includes(status)

function ShelfVolume({ item, stacks, music, act }) {
  const book = item.book
  const ribbon = isWanted(item.status) ? 'want_to_listen' : item.status
  const chapters = book.chapters?.length || 0
  return <article className="channel-cover library-book">
    <Link className="channel-cover-art" href={`/listen/${book.id}`} aria-label={`Open ${book.title}`}>
      <img src={fileUrl(book.coverUrl)} alt="" />
      <span className="channel-rank">{ribbonLabels[ribbon] || 'Saved'}</span>
    </Link>
    <div className="channel-cover-copy">
      <Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link>
      <p>{book.authorName}</p>
      <small>{book.genre}{chapters ? ` · ${chapters} ${chapters === 1 ? 'chapter' : 'chapters'}` : ''}{book.language ? ` · ${book.language}` : ''}</small>
      <button className="button button-primary library-listen" onClick={() => music.playBook(book.id)}><Play size={14} fill="currentColor" />{item.status === 'in_progress' ? 'Resume' : 'Listen'}</button>
      <details className="library-book-options">
        <summary><Settings2 size={14} />Manage book</summary>
        <div>
          <label className="field-label">Listening status<select aria-label={`Status for ${book.title}`} className="text-field" value={isWanted(item.status) ? 'wishlist' : item.status} onChange={event => act(() => api('/library', { method: 'POST', body: JSON.stringify({ bookId: book.id, status: event.target.value }) }))}><option value="wishlist">Want to listen</option><option value="in_progress">Continue listening</option><option value="finished">Finished</option></select></label>
          <label className="field-label">Add to book collection<select aria-label="Add to book collection" className="text-field" value="" onChange={event => { if (event.target.value) act(() => api(`/stacks/${event.target.value}/books`, { method: 'POST', body: JSON.stringify({ bookId: book.id }) })) }}><option value="">Choose a collection</option>{stacks.map(stack => <option key={stack.id} value={stack.id}>{stack.name}</option>)}</select></label>
          {!stacks.length && <Link className="studio-link" href="/collections">Create a collection</Link>}
          <button className="studio-remove-book" onClick={() => act(() => api(`/library/${book.id}`, { method: 'DELETE' }))}>Remove from library</button>
        </div>
      </details>
    </div>
  </article>
}
export default function BookLibrary({ collectionsOnly = false }) {
  const {user,ready} = useAuth()
  const router = useRouter()
  const music = useMusic()
  const [items,setItems] = useState([])
  const [stacks,setStacks] = useState([])
  const [status,setStatus] = useState('')
  const [name,setName] = useState('')
  const [query,setQuery] = useState('')
  const [genre,setGenre] = useState('')
  const [sort,setSort] = useState('default')
  const [view,setView] = useState('grid')
  const [error,setError] = useState('')
  const load = async () => {
    if (!user) return
    try { const [library,lists] = await Promise.all([api('/library'),api('/stacks')]);setItems(library.items);setStacks(lists.stacks);setError('') } catch(err) {setError(err.message)}
  }
  useEffect(() => {load()},[user])
  useEffect(() => {setStatus(isWanted(router.query.status) ? 'want_to_listen' : router.query.status || '')},[router.query.status])
  const act = async fn => {try {await fn();await load();window.dispatchEvent(new Event('groovy:library'))} catch(err) {setError(err.message)}}
  const update = (stack,bookIds) => act(() => api(`/stacks/${stack.id}`,{method:'PATCH',body:JSON.stringify({bookIds})}))
  const filtered = items.filter(item => (!status || (status === 'want_to_listen' ? isWanted(item.status) : item.status === status)) && matches(item.book,query) && (!genre || item.book.genre === genre)).sort((a,b) => sort === 'title' ? a.book.title.localeCompare(b.book.title) : sort === 'author' ? a.book.authorName.localeCompare(b.book.authorName) : sort === 'plays' ? b.book.plays-a.book.plays : 0)
  if (!ready) return <p className="muted">Loading your library...</p>
  if (!user) return <header className="channel-stage"><div className="page-intro"><span className="eyebrow">YOUR LIBRARY</span><h1>Your personal library</h1><p>Sign in to keep your books, progress, and collections together.</p><Link className="button button-primary" href="/login">Sign in to open your library</Link></div></header>
  return <div className={`listening-dashboard ${collectionsOnly ? '' : 'library-studio'}`}>
    {!collectionsOnly && <><header className="channel-stage">{(filtered[0]?.book || items[0]?.book)?.coverUrl && <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl((filtered[0]?.book || items[0]?.book).coverUrl)})` }} />}<div className="page-intro"><span className="eyebrow">YOUR LIBRARY</span><h1>{statusLabels[status] || 'My library'}</h1><p>{items.length} {items.length === 1 ? 'story' : 'stories'} saved. Pick one up, or find the next.</p><div className="library-studio-overview"><span><strong>{items.filter(item=>item.status==='in_progress').length}</strong><Headphones size={15}/>in progress</span><span><strong>{items.filter(item=>item.status==='finished').length}</strong><CheckCircle2 size={15}/>finished</span><span><strong>{stacks.length}</strong><BookOpen size={15}/>collections</span><Link className="studio-link" href="/creator">Upload a book<ArrowUpRight size={15}/></Link></div></div></header>
    <div className="library-shelf-tools"><div className="library-view-toggle" role="group" aria-label="Library view"><button className={view==='grid'?'selected':''} aria-label="Grid view" aria-pressed={view==='grid'} onClick={()=>setView('grid')}><Grid2X2 size={17}/></button><button className={view==='list'?'selected':''} aria-label="List view" aria-pressed={view==='list'} onClick={()=>setView('list')}><LayoutList size={18}/></button></div></div>
    <nav className="library-status-pills" aria-label="Library status">{['','in_progress','finished','want_to_listen'].map(value=>{const count=items.filter(item=>!value||(value==='want_to_listen'?isWanted(item.status):item.status===value)).length;return <button key={value} className={status===value?'selected':''} onClick={()=>{setStatus(value);router.replace(value?`/library?status=${value}`:'/library',undefined,{shallow:true})}}>{statusLabels[value]||'All books'}<span>{count}</span></button>})}</nav>
    <CollectionTools query={query} onQuery={setQuery} genre={genre} onGenre={setGenre} genres={[...new Set(items.map(item=>item.book.genre))].sort()} sort={sort} onSort={setSort} count={filtered.length}/>
    <div className={`channel-shelf library-shelf ${view==='list'?'is-list-view':''}`}>{filtered.map(item => <ShelfVolume key={item.id} item={item} stacks={stacks} music={music} act={act} />)}</div>
    {!filtered.length&&<NoResults clear={()=>{setQuery('');setGenre('');setStatus('');router.replace('/library',undefined,{shallow:true})}}/>}
    <Link className="studio-library-footer" href="/browse"><span className="studio-widget-icon"><Sparkles size={23}/></span><span><strong>There is always room for one more story.</strong><small>Explore the catalog and find your next great listen.</small></span><ArrowRight size={21}/></Link></>}
    {error && <p className="form-alert" role="alert">{error}</p>}
    {collectionsOnly && <section className="stack-section" id="book-stacks"><h2>Book collections</h2><p>Each entry contains a whole audiobook. Chapters always stay in their original order.</p><form className="page-search" onSubmit={event => {event.preventDefault();act(async () => {await api('/stacks',{method:'POST',body:JSON.stringify({name})});setName('')})}}><input className="text-field" aria-label="New book collection name" value={name} maxLength={80} required onChange={event => setName(event.target.value)} placeholder="Name your book collection" /><button className="button button-primary" type="submit">Create book collection</button></form>
    {stacks.map(stack => <article key={stack.id} className="dashboard-panel"><div className="dashboard-row"><div><h3>{stack.name}</h3><small className="muted">{stack.books.length} whole books</small></div><div><button className="button button-quiet" onClick={() => {const name=prompt('Rename book collection',stack.name);if(name?.trim())act(() => api(`/stacks/${stack.id}`,{method:'PATCH',body:JSON.stringify({name})}))}}>Rename</button><button className="button button-quiet danger-action" onClick={() => {if(confirm('Delete this collection? Books stay in your library.'))act(() => api(`/stacks/${stack.id}`,{method:'DELETE'}))}}>Delete collection</button></div></div><label className="field-label">Add a whole book<select className="text-field" aria-label={`Add a book to ${stack.name}`} value="" onChange={event => {if(event.target.value)act(() => api(`/stacks/${stack.id}/books`,{method:'POST',body:JSON.stringify({bookId:event.target.value})}))}}><option value="">Choose from My books</option>{items.filter(item => !stack.books.some(book => book.id === item.book.id)).map(item => <option key={item.id} value={item.book.id}>{item.book.title}</option>)}</select></label>{stack.books.map((book,index) => <div className="dashboard-row" key={book.id}><Link href={`/listen/${book.id}`}>{index+1}. {book.title}</Link><div><button className="button button-quiet" onClick={() => music.playBook(book.id)}>Listen</button><button className="button button-quiet" disabled={!index} aria-label={`Move ${book.title} up`} onClick={() => {const ids=stack.books.map(b=>b.id);[ids[index-1],ids[index]]=[ids[index],ids[index-1]];update(stack,ids)}}>Up</button><button className="button button-quiet" disabled={index===stack.books.length-1} aria-label={`Move ${book.title} down`} onClick={() => {const ids=stack.books.map(b=>b.id);[ids[index+1],ids[index]]=[ids[index],ids[index+1]];update(stack,ids)}}>Down</button><button className="button button-quiet" onClick={() => update(stack,stack.books.filter(b=>b.id!==book.id).map(b=>b.id))}>Remove</button></div></div>)}{!stack.books.length && <p className="muted">Add a book using the selector above, or save more books from Browse.</p>}</article>)}{!stacks.length && <p className="muted">Create a collection for your next trip, favorite series, or evening listening.</p>}</section>}
  </div>
}
