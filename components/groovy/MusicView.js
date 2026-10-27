import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, AudioLines, BookOpen, Check, ChevronLeft, ChevronRight, Coffee, Ellipsis, Heart, Moon, Pause, Play, Plus, Search, Sparkles, Sun, Upload } from 'lucide-react'
import { CollectionTools, FilteredBooks, matches, NoResults, WorkspaceBookCard } from './WorkspaceUI'
import Downloads from './Downloads'
import PeopleDirectory from './PeopleDirectory'
import DiscoveryChannels from './DiscoveryChannels'
import BrowseCatalog from './BrowseCatalog'
import { genres } from '@/data/groovy'
import { useMusic } from './MusicProvider'
import { useAuth } from './AuthProvider'
import { ArtistCard, IconButton, MixCard, Modal, SectionHeading, TrackList } from './UI'
import { api, avatarUrl, fileUrl, toPlayerTracks } from '@/lib/api'

const genreIcons = { book: BookOpen, sparkles: Sparkles, sun: Sun, coffee: Coffee, moon: Moon }

function BookCard({ book, music }) {
  const router = useRouter()
  if (router.pathname !== '/') return <WorkspaceBookCard book={book} />
  const lead = toPlayerTracks(book)[0]
  const playing = lead && music.current.id === lead.id && music.playing
  const liked = lead && music.liked.includes(lead.id)
  return <article className="album-card book-card">
    <div className="book-cover-frame">
      <Link href={`/listen/${book.id}`} className="album-art book-cover" aria-label={`Open ${book.title}`}>
        <img src={fileUrl(book.coverUrl)} alt="" loading="lazy" />
      </Link>
      <div className="book-card-actions">
        <button type="button" className="book-card-icon book-card-play" aria-label={playing ? `Pause ${book.title}` : `Play ${book.title}`} onClick={() => playing ? music.togglePlay() : music.playBook(book.id)}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
        <button type="button" className={`book-card-icon book-card-like ${liked ? 'is-liked' : ''}`} aria-label={liked ? `Unlike ${book.title}` : `Like ${book.title}`} aria-pressed={!!liked} disabled={!lead} onClick={() => music.toggleTrackLike(lead)}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button>
      </div>
    </div>
    <div className="book-card-body">
      <Link href={`/listen/${book.id}`} className="book-card-title">{book.title}</Link>
      <p className="book-card-meta">{book.authorName}</p>
    </div>
  </article>
}

function Hero({ books }) {
  const [index, setIndex] = useState(0)
  const music = useMusic()
  if (!books.length) return <section className="hero"><div className="hero-copy"><h1>Discover your next story.</h1><p>Choose a classic and settle in for a little listening.</p><Link className="button button-primary" href="/browse">Browse books</Link></div></section>
  const book = books[index % books.length]
  const tracks = toPlayerTracks(book)
  const active = tracks[0] && music.current.id === tracks[0].id && music.playing
  const play = () => { if (tracks[0]) music.playTrack(tracks[0], tracks) }
  return <section className="hero" aria-label="Featured book">
    <motion.img key={book.id} className="hero-portrait" src={fileUrl(book.coverUrl)} alt={book.title} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }} fetchPriority="high" />
    <div className="hero-overlay" /><span className="hero-watermark">KEEP LISTENING.</span>
    <motion.div key={book.id} className="hero-copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
      <span className="hero-tag"><span />FEATURED · {book.genre.toUpperCase()}</span>
      <h1>{book.title}</h1>
      <div className="hero-artist"><span>{book.authorName}</span><span className="verified"><Check size={9} strokeWidth={3} /></span><span className="hero-artist-detail">Narrated by {book.narrator}</span></div>
      <p>{book.description}</p>
      <div className="hero-actions">
        <button className="button button-primary" onClick={() => active ? music.togglePlay() : play()}>{active ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{active ? 'Pause' : 'Listen now'}</button>
        <Link className="button button-quiet" href={`/listen/${book.id}`}>Open book</Link>
      </div>
    </motion.div>
    <div className="hero-pagination">
      <div className="hero-dots">{books.slice(0, 5).map((item, i) => <button key={item.id} className={index % books.length === i ? 'active' : ''} aria-label={`Featured ${item.title}`} onClick={() => setIndex(i)} />)}</div>
      <div className="hero-arrows">
        <IconButton label="Previous featured book" onClick={() => setIndex((index + books.length - 1) % books.length)}><ChevronLeft size={17} /></IconButton>
        <IconButton label="Next featured book" onClick={() => setIndex((index + 1) % books.length)}><ChevronRight size={17} /></IconButton>
      </div>
    </div>
  </section>
}

function Recommended({ music }) {
  const [books, setBooks] = useState([])
  useEffect(() => { api('/books/recommend').then(data => setBooks(data.books || [])).catch(() => {}) }, [])
  if (!books.length) return null
  return <section className="made-for-you"><SectionHeading title="Because you listen" /><div className="album-grid">{books.map(book => <BookCard key={book.id} book={book} music={music} />)}</div></section>
}

function GenreTiles({ full = false }) {
  const router = useRouter()
  return <div className={`genre-grid ${full ? 'full-genres' : ''}`}>{genres.slice(0, full ? genres.length : 4).map(genre => { const Icon = genreIcons[genre.icon] || BookOpen; return <Link key={genre.name} href={`/browse?tab=categories&genre=${encodeURIComponent(genre.name)}`} className={`genre-tile ${router.query.genre === genre.name ? 'is-current' : ''}`} style={{ '--genre-color': genre.color }}><span><strong>{genre.name}</strong>{full && <small>{genre.caption}</small>}</span><Icon size={full ? 44 : 34} strokeWidth={1} /><ArrowUpRight className="genre-arrow" size={15} /></Link> })}</div>
}

const phoneFilters = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New Release' },
  { id: 'trending', label: 'Trending' },
  { id: 'top', label: 'Top' }
]

function sortPhoneBooks(books, filter) {
  const list = [...books]
  if (filter === 'new') return list.reverse()
  if (filter === 'trending') return list.sort((a, b) => (b.live || 0) - (a.live || 0))
  if (filter === 'top') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.ratingCount || 0) - (a.ratingCount || 0))
  return list
}

function PhoneHome({ books, music }) {
  const auth = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const sorted = sortPhoneBooks(books, filter)
  const featured = sorted[0]
  const rest = sorted.slice(1)
  const name = auth.user?.name?.split(' ')[0] || 'there'
  const featuredTracks = featured ? toPlayerTracks(featured) : []
  const featuredPlaying = featuredTracks[0] && music.current.id === featuredTracks[0].id && music.playing
  const featuredLiked = featuredTracks[0] && music.liked.includes(featuredTracks[0].id)
  return <div className="phone-home">
    <div className="phone-home-bar">
      {auth.user ? <Link href="/profile" className="phone-home-avatar" aria-label="Your profile">{auth.user.avatar ? <img src={avatarUrl(auth.user.avatar)} alt="" /> : <span>{name[0]}</span>}</Link> : <Link href="/login" className="phone-home-avatar" aria-label="Sign in"><span>G</span></Link>}
      <div className="phone-home-actions">
        <button type="button" aria-label="Search" onClick={() => router.push('/search')}><Search size={22} /></button>
        <Link href="/collection/tracks" aria-label="Liked chapters"><Heart size={22} /></Link>
      </div>
    </div>
    <h1 className="phone-hello">Hi, {name}</h1>
    <div className="phone-chips" role="tablist" aria-label="Catalog filters">
      {phoneFilters.map(item => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}
    </div>
    <section>
      <h2 className="phone-section-title">Curated &amp; trending</h2>
      {featured ? <article className="phone-feature">
        <div className="phone-feature-copy">
          <h3>{featured.title}</h3>
          <p>{featured.description || `${featured.genre} · narrated by ${featured.narrator}`}</p>
          <div className="phone-feature-actions">
            <button type="button" className="phone-play" aria-label={featuredPlaying ? 'Pause' : `Play ${featured.title}`} onClick={() => featuredPlaying ? music.togglePlay() : music.playBook(featured.id)}>{featuredPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button type="button" className={`phone-icon ${featuredLiked ? 'is-liked' : ''}`} aria-label="Like this book" disabled={!featuredTracks[0]} onClick={() => music.toggleTrackLike(featuredTracks[0])}><Heart size={18} fill={featuredLiked ? 'currentColor' : 'none'} /></button>
            <Link className="phone-icon" href={`/listen/${featured.id}`} aria-label="Open book"><Ellipsis size={18} /></Link>
          </div>
        </div>
        <Link href={`/listen/${featured.id}`} className="phone-feature-art" aria-label={`Open ${featured.title}`}><img src={fileUrl(featured.coverUrl)} alt="" /></Link>
      </article> : <p className="muted">The catalog will appear here once the local API is running.</p>}
    </section>
    <section>
      <div className="phone-section-title"><h2>Top daily listens</h2><Link href="/albums">See all</Link></div>
      <div className="phone-list">
        {(rest.length ? rest : sorted).slice(0, 8).map(book => {
          const tracks = toPlayerTracks(book)
          const playing = tracks[0] && music.current.id === tracks[0].id && music.playing
          const chapters = book.chapters?.length || tracks.length
          return <article key={book.id} className="phone-row">
            <Link href={`/listen/${book.id}`}><img src={fileUrl(book.coverUrl)} alt="" /></Link>
            <Link href={`/listen/${book.id}`}><strong>{book.title}</strong><small>By {book.authorName} · {chapters} {chapters === 1 ? 'chapter' : 'chapters'}</small></Link>
            <button type="button" className="phone-play phone-play-line" aria-label={playing ? `Pause ${book.title}` : `Play ${book.title}`} onClick={() => playing ? music.togglePlay() : music.playBook(book.id)}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
          </article>
        })}
      </div>
    </section>
  </div>
}

function HomeView() {
  const music = useMusic()
  const [publicBooks, setPublicBooks] = useState([])
  const [authors, setAuthors] = useState([])
  const [live, setLive] = useState({ live: [], listeners: 0 })
  useEffect(() => {
    api('/books/public').then(data => setPublicBooks(data.books || [])).catch(() => {})
    api('/books/authors').then(data => setAuthors(data.authors || [])).catch(() => {})
    const refreshLive = () => api('/books/live').then(data => { setLive(data); setPublicBooks(previous => previous.map(book => ({ ...book, live: data.live.find(item => item.id === book.id)?.live || 0 }))) }).catch(() => {})
    refreshLive()
    const timer = setInterval(refreshLive, 15000)
    return () => clearInterval(timer)
  }, [])
  const continueTracks = music.getTracksByIds(music.history).slice(0, 6)
  return <div className="discovery-page">
    <PhoneHome books={publicBooks} music={music} />
    <div className="desktop-home">
    <p className="demo-banner">Demo catalog &middot; fictional curator profiles &middot; real LibriVox audio excerpts</p>
    <Hero books={publicBooks.slice(0, 5)} />
    <section className="artists-section"><SectionHeading title="Demo curators" href="/browse?tab=people#demo-curators" /><div className="artists-row">{authors.slice(0, 6).map(artist => <ArtistCard key={artist.id} artist={{ ...artist, image: avatarUrl(artist.image), listeners: `${artist.books?.length || 0} books` }} />)}</div></section>
    <div className="discovery-columns">
      <section className="genres-section"><SectionHeading title="Categories" href="/browse?tab=categories" /><GenreTiles /></section>
      <section className="charts-section"><SectionHeading title="Continue listening" href="/library?status=in_progress" /><TrackList tracks={continueTracks} showAlbum empty="Your recent chapters appear here after you press play." /></section>
    </div>
    {publicBooks.length > 0 && <section className="made-for-you"><SectionHeading title="Catalog" eyebrow={`${live.listeners || 0} LISTENING LIVE`} href="/albums" /><div className="album-grid">{publicBooks.map(book => <BookCard key={book.id} book={book} music={music} showLive />)}</div></section>}
    <Recommended music={music} />
    <div className="page-footnote"><AudioLines size={16} /><span>Audio: LibriVox / Internet Archive. Demo portraits: Random User.</span><span>Made for listening.</span></div>
    </div>
  </div>
}

function PageIntro({ eyebrow, title, description, children, headingLevel = 'h1' }) { const Heading = headingLevel; return <div className="page-intro"><span className="eyebrow">{eyebrow || 'MAKE YOURSELF AT HOME'}</span><div><Heading>{title}</Heading>{children}</div>{description && <p>{description}</p>}</div> }


function PlaylistView({ id }) {
  const music = useMusic()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const isFavorites = id === 'favorites'
  const playlist = isFavorites ? { name: 'Liked chapters', subtitle: 'Chapters marked with a heart. Bookmarks save a specific time and note.', trackIds: music.liked, image: fileUrl('') } : music.playlists.find(item => item.id === id)
  if (!playlist) return <><PageIntro title="Your listening list" description="This list is empty or has been removed." /><Link className="button button-primary" href="/collections?type=chapters">Back to your lists</Link></>
  const allTracks = music.getTracksByIds(playlist.trackIds)
  const tracks = allTracks.filter(track => matches(track, query))
  const move = (trackId, direction) => { const ids = [...playlist.trackIds]; const index = ids.indexOf(trackId); const other = index + direction; if (index < 0 || other < 0 || other >= ids.length) return; [ids[index], ids[other]] = [ids[other], ids[index]]; music.updatePlaylist(id, { trackIds: ids }) }
  return <><Link className="back-link" href="/collections?type=chapters"><ArrowLeft size={16} />Chapter collections</Link><div className={`collection-hero ${isFavorites ? 'favorites-hero' : ''}`}><div className="collection-cover">{isFavorites ? <Heart size={60} fill="currentColor" /> : <img src={playlist.image} alt="" />}</div><div><span className="eyebrow">{isFavorites ? 'LIKED CHAPTERS' : 'CHAPTER COLLECTION'}</span><h1>{playlist.name}</h1><p>{playlist.subtitle}</p><span className="collection-meta">{allTracks.length} chapters</span></div></div><div className="collection-controls"><button className="button button-primary" disabled={!tracks.length} onClick={() => music.playTrack(tracks[0], tracks)}><Play size={16} fill="currentColor" />Play all</button>{!isFavorites && <><button className="button button-quiet" onClick={() => { setName(playlist.name); setEditing(true) }}>Rename collection</button><button className="button button-quiet danger-action" onClick={() => { if (confirm('Delete this listening list? Your books and saved chapters will stay in your library.')) { music.deletePlaylist(id); router.push('/collections?type=chapters') } }}>Delete collection</button></>}</div><CollectionTools query={query} onQuery={setQuery} count={tracks.length} placeholder="Search chapters in this list..." /><TrackList tracks={tracks} showAlbum removable onRemove={track => isFavorites ? music.toggleLike(track.id) : music.updatePlaylist(id, { trackIds: playlist.trackIds.filter(item => item !== track.id) })} onMove={!isFavorites && !query ? move : undefined} empty="No chapters in this selection." />{!isFavorites && <p className="muted">Add chapters from their options menu. Use the arrows to put them in your preferred order.</p>}{editing && <Modal title="Rename chapter collection" onClose={() => setEditing(false)}><form className="note-form" onSubmit={event => { event.preventDefault(); music.updatePlaylist(id, { name }); setEditing(false) }}><label className="field-label">List name<input className="text-field" maxLength={80} required value={name} onChange={event => setName(event.target.value)} /></label><button type="submit" className="button button-primary" disabled={!name.trim()}>Save name</button></form></Modal>}</>
}

function ArtistsView() { return <PeopleDirectory /> }

function SearchView() {
  const router = useRouter()
  const music = useMusic()
  const query = router.query.searchQuery || ''
  const [value, setValue] = useState(query)
  useEffect(() => { setValue(query) }, [query])
  const [uploaded, setUploaded] = useState([])
  const [authors, setAuthors] = useState([])
  useEffect(() => {
    if (!query) { setUploaded([]); return }
    api(`/books/public?q=${encodeURIComponent(query)}`).then(data => setUploaded(data.books || [])).catch(() => {})
    api('/books/authors').then(data => {
      const normalized = String(query).toLowerCase()
      setAuthors((data.authors || []).filter(artist => `${artist.name} ${artist.genre}`.toLowerCase().includes(normalized)))
    }).catch(() => {})
  }, [query])
  return <><PageIntro eyebrow="FOLLOW YOUR CURIOSITY" title={query ? `Results for “${query}”` : 'What are you looking for?'} description="Search the live catalog — LibriVox chapters and uploaded books." /><form className="page-search" onSubmit={event => { event.preventDefault(); if (value.trim()) router.push(`/search/${encodeURIComponent(value.trim())}`) }}><Search size={22} /><input aria-label="Find books" placeholder="Books, authors, narrators..." value={value} onChange={event => setValue(event.target.value)} /><button className="button button-primary" type="submit">Search</button></form>{!query ? <><SectionHeading title="Browse categories" /><GenreTiles full /></> : <><section className="search-result-section"><SectionHeading title="Books" />{uploaded.length ? <FilteredBooks books={uploaded} /> : <p className="muted">No books match this search.</p>}</section><section className="search-result-section"><SectionHeading title="Curator profiles" />{authors.length ? <div className="artists-full-grid">{authors.map(artist => <ArtistCard key={artist.id} artist={{ ...artist, image: avatarUrl(artist.image), listeners: `${artist.books?.length || 0} books` }} />)}</div> : <p className="muted">No curator profiles match this search.</p>}</section></>}</>
}

export function BooksView({ library = false }) {
  return <BrowseCatalog />
}

export function PlaylistsView({ embedded = false }) {
  const [query, setQuery] = useState('')
  const music = useMusic()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  return <><PageIntro eyebrow="A SPACE THAT’S YOURS" headingLevel={embedded ? 'h2' : 'h1'} title="Chapter collections" description="Arrange individual chapters in your own order. Whole-book collections are managed in the Whole books tab."><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={17} />New chapter collection</button></PageIntro><CollectionTools query={query} onQuery={setQuery} count={music.playlists.filter(item => matches(item, query)).length} placeholder="Search listening lists..." />{music.playlists.length > 0 && <section className="custom-playlists"><SectionHeading title="Made by you" /><div className="mix-grid">{music.playlists.filter(item => matches(item, query)).map(mix => <MixCard key={mix.id} mix={mix} />)}</div></section>}<Link className="favorites-banner" href="/collection/tracks"><span className="favorites-icon"><Heart size={28} fill="currentColor" /></span><span><h3>Liked chapters</h3><p>{music.liked.length} chapters you want nearby.</p></span><ArrowUpRight size={24} /></Link>{creating && <Modal title="A chapter collection" onClose={() => setCreating(false)}><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; const playlist = music.createPlaylist(name); setCreating(false); router.push(`/playlist/${playlist.id}`) }}><label htmlFor="new-playlist" className="field-label">List name</label><input id="new-playlist" className="text-field" maxLength={60} required value={name} onChange={event => setName(event.target.value)} placeholder="Weekend stack..." /><button type="submit" className="button button-primary full-width" disabled={!name.trim()}>Create collection</button></form></Modal>}</>
}

function LocalView() {
  const [query, setQuery] = useState('')
  const music = useMusic()
  const inputRef = useRef(null)
  if (!music.hydrated) return <p className="muted">Loading your audio collection...</p>
  return <><PageIntro eyebrow="BRING YOUR OWN AUDIO" title="Import audio" description="Your files, with a place to keep listening." /><div className="upload-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); music.importFiles(event.dataTransfer.files) }}><span><Upload size={28} /></span><h2>A home for your own chapters.</h2><p>Drop your audio files here, or browse your device.</p><button className="button button-primary" onClick={() => inputRef.current.click()}><Plus size={17} />Choose audio files</button><small>MP3, WAV, OGG, M4A · Files stay on your device and are available for this session.</small><input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" multiple hidden onChange={event => { music.importFiles(event.target.files); event.target.value = '' }} /></div>{music.localTracks.length > 0 && <><SectionHeading title="Your local audio" /><CollectionTools query={query} onQuery={setQuery} count={music.localTracks.filter(item => matches(item, query)).length} placeholder="Search local audio..." /><TrackList tracks={music.localTracks.filter(item => matches(item, query))} removable onRemove={track => music.removeLocalTrack(track.id)} /></>}</>
}

export function GenrePage() {
  const router = useRouter()
  const music = useMusic()
  const selected = genres.find(genre => genre.name === router.query.genre)
  const [uploaded, setUploaded] = useState([])
  useEffect(() => {
    if (!router.isReady) return
    let active = true
    const params = selected ? `?genre=${encodeURIComponent(selected.name)}` : ''
    api(`/books/public${params}`).then(data => { if (active) setUploaded(data.books || []) }).catch(() => {})
    return () => { active = false }
  }, [selected?.name, router.isReady])
  const spotlight = uploaded[0]
  return <div className="category-page"><header className="channel-stage">{spotlight?.coverUrl && <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(spotlight.coverUrl)})` }} />}<div className="page-intro"><span className="eyebrow">FIND A SHELF</span><h1>{selected ? `${selected.name}, your way.` : 'What are you in the mood to hear?'}</h1><p>{selected ? selected.caption : 'Pick a category from the catalog.'}</p></div></header><GenreTiles full />
    <section className="genre-results"><SectionHeading title={selected ? `${selected.name} books` : 'All catalog books'} /><FilteredBooks books={uploaded} />{!uploaded.length && <p className="muted">No books in this category yet.</p>}</section>
  </div>
}

function RecentView() {
  const music = useMusic()
  const [query, setQuery] = useState('')
  const tracks = music.getTracksByIds(music.history).filter(track => matches(track, query))
  return <><PageIntro eyebrow="PICK UP WHERE YOU LEFT OFF" title="Continue listening" description="Find a recent chapter and return to your story." /><CollectionTools query={query} onQuery={setQuery} count={tracks.length} placeholder="Search listening history..." /><TrackList tracks={tracks} showAlbum removable onRemove={track => music.removeFromHistory(track.id)} empty="No recent chapters match this selection." /></>
}

export default function MusicView() {
  const router = useRouter()
  const music = useMusic()
  const path = router.asPath.split('?')[0]
  if (path.startsWith('/search')) return <SearchView />
  if (path === '/collection/tracks') return <PlaylistView id="favorites" />
  if (path.startsWith('/playlist/')) return <PlaylistView id={router.query.playlist_id || path.split('/').pop()} />
  if (path.includes('artists')) return <ArtistsView />
  if (path.includes('podcasts') || path.includes('episodes') || router.query.tab === 'podcasts') return <BooksView />
  if (path.includes('albums')) return <BooksView library={path.startsWith('/collection')} />
  if (path === '/collection/playlists') return <PlaylistsView />
  if (path === '/genres') return <GenrePage />
  if (path === '/radio' || path === '/charts') return <DiscoveryChannels mode={path.slice(1)} />
  if (path === '/download') return <Downloads />
  if (path === '/local') return <LocalView />
  if (path === '/recent') return <RecentView />

  return <HomeView />
}
