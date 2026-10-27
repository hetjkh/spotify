import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Bookmark, BookOpen, Check, Clock3, Download, Eye, Globe2, Headphones, Heart, Pause, Play, Search, Star, X } from 'lucide-react'
import { useAuth } from '@/components/groovy/AuthProvider'
import { useMusic } from '@/components/groovy/MusicProvider'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { downloadBook as saveOffline } from '@/lib/offline'
import { formatTime } from '@/data/groovy'
import { NoResults } from '@/components/groovy/WorkspaceUI'

function Stars({ value }) {
  return <span className="detail-stars" role="img" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} size={12} fill={star <= Math.round(value) ? 'currentColor' : 'none'} />)}</span>
}

export default function ListenPage() {
  const router = useRouter()
  const music = useMusic()
  const auth = useAuth()
  const userId = auth.user?.id
  const bookId = router.query.id
  const [downloadPercent, setDownloadPercent] = useState(null)
  const [book, setBook] = useState(null)
  const [seriesBooks, setSeriesBooks] = useState([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const [bookmarks, setBookmarks] = useState([])
  const [chapterQuery, setChapterQuery] = useState('')
  const [stacks, setStacks] = useState([])
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('book-overview')
  const load = useCallback(async () => {
    if (!bookId) return
    try {
      const data = await api(`/books/${bookId}`)
      setBook(data.book)
      setSeriesBooks(data.seriesBooks || [])
      setError('')
    } catch (err) { setError(err.message) }
  }, [bookId])
  useEffect(() => {
    setBook(null); setSeriesBooks([]); setError(''); setChapterQuery(''); setActiveSection('book-overview')
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [load])
  useEffect(() => {
    let active = true
    setStacks([]); setSaved(false)
    if (userId) {
      api('/stacks').then(data => { if (active) setStacks(data.stacks || []) }).catch(() => {})
      api('/library').then(data => { if (active) setSaved((data.items || []).some(item => String(item.book.id) === String(bookId))) }).catch(() => {})
    }
    return () => { active = false }
  }, [userId, bookId])
  useEffect(() => {
    let active = true
    setBookmarks([])
    if (!userId || !bookId) return
    const loadMarks = () => api(`/bookmarks?bookId=${bookId}`).then(data => { if (active) setBookmarks(data.bookmarks || []) }).catch(() => {})
    loadMarks()
    window.addEventListener('groovy:bookmarks', loadMarks)
    return () => { active = false; window.removeEventListener('groovy:bookmarks', loadMarks) }
  }, [userId, bookId])
  if (!book) return <div className="book-detail-state" role={error ? 'alert' : 'status'}><BookOpen size={34} strokeWidth={1.3} /><h1>{error ? 'This book is taking a moment.' : 'Opening your next chapter...'}</h1>{error && <><p>{error}</p><button className="button button-quiet" onClick={load}>Try again</button></>}<Link href="/browse">Back to Browse</Link></div>

  const tracks = toPlayerTracks(book)
  const chapters = book.chapters || []
  const visibleChapters = chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => chapter.title.toLowerCase().includes(chapterQuery.trim().toLowerCase()))
  const totalSeconds = chapters.reduce((total, chapter) => total + (chapter.duration || 0), 0)
  const totalMinutes = Math.ceil(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const lengthLabel = totalSeconds ? [hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean).join(' ') : 'Audio'
  const sampleIndex = Math.max(0, (book.sampleChapter || 1) - 1)
  const resume = book.progress
  const startIndex = resume?.chapterId ? Math.max(0, tracks.findIndex(track => track.id === String(resume.chapterId))) : 0
  const isCurrentBook = String(music.current.bookId) === String(book.id)
  const isPlaying = isCurrentBook && music.playing
  const playFrom = (index, seconds) => {
    if (!tracks[index]) return
    music.playTrack(tracks[index], tracks, seconds)
    api(`/books/${book.id}/play`, { method: 'POST', body: JSON.stringify({}) }).catch(() => {})
  }
  const listen = () => {
    if (isCurrentBook) music.togglePlay()
    else playFrom(startIndex, resume?.seconds || 0)
  }
  const setLibrary = async () => {
    if (!auth.user) { router.push('/login'); return }
    setPending('library')
    try {
      await api('/library', { method: 'POST', body: JSON.stringify({ bookId: book.id, status: 'wishlist' }) })
      setSaved(true); music.notify('Added to Want to listen'); window.dispatchEvent(new Event('groovy:library'))
    } catch (err) { music.notify(err.message) } finally { setPending('') }
  }
  const downloadBook = async () => {
    try {
      setDownloadPercent(0)
      await saveOffline(book, auth.user?.id, setDownloadPercent)
      music.notify('Book saved for offline listening')
    } catch { music.notify('Could not download this book. Check your connection and available storage.') }
    finally { setDownloadPercent(null) }
  }
  const bookmarkChapter = async (chapter, index) => {
    if (!auth.user) { router.push('/login'); return }
    try {
      await api('/bookmarks', { method: 'POST', body: JSON.stringify({ bookId: book.id, chapterId: tracks[index].id, chapterTitle: chapter.title, seconds: 0 }) })
      window.dispatchEvent(new Event('groovy:bookmarks')); music.notify('Chapter start bookmarked')
    } catch (err) { music.notify(err.message) }
  }

  return <article className="book-detail">
    <div className="detail-topline"><Link href="/browse"><ArrowLeft size={16} />Back to Browse</Link><span><Headphones size={13} />{book.isDemo ? 'Audio excerpts' : book.visibility === 'public' ? 'Audiobook' : 'Private audiobook'}</span></div>
    <header className="detail-hero">
      <div className="detail-hero-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(book.coverUrl)})` }} />
      <div className="detail-cover"><img src={fileUrl(book.coverUrl)} alt={`${book.title} cover`} fetchPriority="high" /></div>
      <div className="detail-hero-copy">
        <Link className="detail-genre" href={`/browse?tab=categories&genre=${encodeURIComponent(book.genre || '')}`}>{book.genre || 'Audiobook'}<ArrowUpRight size={12} /></Link>
        <h1>{book.title}</h1>
        <p className="detail-author">By <Link href={`/browse?tab=people&author=${encodeURIComponent(book.authorName || '')}`}>{book.authorName || 'Unknown author'}</Link></p>
        {book.narrator && <p className="detail-narrator">Narrated by <Link href={`/narrator/${encodeURIComponent(book.narrator)}`}>{book.narrator}</Link></p>}
        {book.series && <Link className="detail-series-link" href={`/series/${encodeURIComponent(book.series)}`}>Book {book.seriesIndex} of {book.series}<ArrowUpRight size={12} /></Link>}
        <div className="detail-rating">{book.ratingCount ? <><Stars value={book.rating} /><strong>{book.rating.toFixed(1)}</strong><span>{book.ratingCount} {book.ratingCount === 1 ? 'rating' : 'ratings'}</span></> : <span>No ratings yet</span>}<span className="detail-live"><Eye size={13} />{book.live || 0} listening</span></div>
        <div className="detail-play-actions"><button className="button detail-listen" disabled={!tracks.length} onClick={listen}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{isPlaying ? 'Pause' : isCurrentBook || resume?.seconds ? 'Resume listening' : 'Start listening'}</button><button className="button detail-sample" disabled={!tracks[sampleIndex]} onClick={() => playFrom(sampleIndex)}><Headphones size={16} />Sample chapter</button></div>
        <div className="detail-save-actions"><button type="button" className={saved ? 'is-saved' : ''} aria-pressed={saved} disabled={pending === 'library' || saved} onClick={setLibrary}>{saved ? <Check size={16} /> : <BookOpen size={16} />}{saved ? 'In your library' : 'Want to listen'}</button><button type="button" disabled={downloadPercent != null || !tracks.length} onClick={downloadBook}><Download size={16} />{downloadPercent != null ? `Downloading ${downloadPercent}%` : 'Save offline'}</button>{auth.user && String(auth.user.id) === String(book.owner?.id) && <Link href={`/edit/${book.id}`}>Edit book<ArrowUpRight size={13} /></Link>}</div>
        {auth.user && <label className="detail-stack-label"><span>Add to a collection</span><select aria-label="Add book to collection" value="" onChange={async event => { if (!event.target.value) return; try { await api(`/stacks/${event.target.value}/books`, { method: 'POST', body: JSON.stringify({ bookId: book.id }) }); music.notify('Added to book collection') } catch (err) { music.notify(err.message) } }}><option value="">Choose a book collection</option>{stacks.map(stack => <option key={stack.id} value={stack.id}>{stack.name}</option>)}</select>{!stacks.length && <Link href="/collections">Create a collection<ArrowUpRight size={12} /></Link>}</label>}
      </div>
    </header>
    <dl className="detail-facts"><div><Clock3 size={17} /><dt>Listening time</dt><dd>{lengthLabel}</dd></div><div><BookOpen size={17} /><dt>Chapters</dt><dd>{chapters.length}</dd></div><div><Globe2 size={17} /><dt>Language</dt><dd>{book.language || 'Not specified'}</dd></div></dl>
    <nav className="detail-section-nav" aria-label="Book details">{[['book-overview', 'Overview'], ['book-chapters', 'Chapters']].map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setActiveSection(id)}>{label}{id === 'book-chapters' && <span>{chapters.length}</span>}</a>)}</nav>
    <section className="detail-overview" id="book-overview" aria-labelledby="overview-title"><div className="detail-section-title"><h2 id="overview-title">About this book</h2><span>{book.isDemo ? 'Demo edition' : book.genre}</span></div><p>{book.description || 'Discover this audiobook one chapter at a time.'}</p>{book.owner?.id && <p className="detail-curator">Curated by <Link href={`/u/${book.owner.id}`}>{book.owner.name}<ArrowUpRight size={12} /></Link></p>}{book.sourceUrl && <div className="detail-source"><Headphones size={15} /><div><span>Recording: {book.sourceCredit || 'Original recording'}</span><a href={book.sourceUrl} target="_blank" rel="noreferrer">Full audiobook and original recording<ArrowUpRight size={12} /></a>{book.licenseUrl && <a href={book.licenseUrl} target="_blank" rel="noreferrer">Source license<ArrowUpRight size={12} /></a>}</div></div>}</section>
    <section className="detail-chapters" id="book-chapters" aria-labelledby="chapters-title"><div className="detail-section-title"><div><h2 id="chapters-title">Chapters</h2><p>{chapters.length} chapters{totalSeconds > 0 && <> &middot; {lengthLabel} of listening</>}</p></div><Link href="/bookmarks"><Bookmark size={14} />My bookmarks</Link></div><label className="detail-chapter-search"><Search size={17} /><input aria-label="Search chapters in this book..." placeholder="Find a chapter..." value={chapterQuery} onChange={event => setChapterQuery(event.target.value)} />{chapterQuery && <button type="button" aria-label="Clear chapter search" onClick={() => setChapterQuery('')}><X size={16} /></button>}</label><div className="detail-chapter-list">{visibleChapters.map(({ chapter, index }) => {
      const track = tracks[index]
      const current = music.current.id === track.id
      const playing = current && music.playing
      const liked = music.liked.includes(track.id)
      const marked = bookmarks.some(mark => String(mark.chapterId) === track.id && mark.seconds === 0)
      return <div className={`detail-chapter ${current ? 'is-current' : ''}`} key={track.id}>
        <button type="button" className="detail-chapter-play" aria-label={`${playing ? 'Pause' : 'Play'} ${chapter.title}`} aria-current={current ? 'true' : undefined} onClick={() => current ? music.togglePlay() : playFrom(index)}><span className="detail-chapter-index">{playing ? <span className="detail-equalizer" aria-hidden="true"><i /><i /><i /></span> : <><span>{String(index + 1).padStart(2, '0')}</span><Play size={14} fill="currentColor" /></>}</span><span className="detail-chapter-copy"><strong>{chapter.title}</strong><small>{playing ? 'Now playing' : `Chapter ${index + 1}`}</small></span><span className="detail-chapter-time">{chapter.duration ? formatTime(chapter.duration) : 'Audio'}</span></button><div className="detail-chapter-actions"><button type="button" className="icon-button" aria-label={`${liked ? 'Unlike' : 'Like'} chapter ${chapter.title}`} aria-pressed={liked} onClick={() => music.toggleTrackLike(track)}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button><button type="button" className="icon-button" aria-label={`Bookmark start of ${chapter.title}`} aria-pressed={marked} onClick={() => bookmarkChapter(chapter, index)}><Bookmark size={16} fill={marked ? 'currentColor' : 'none'} /></button></div>
      </div>
    })}</div>{!visibleChapters.length && <NoResults clear={chapterQuery ? () => setChapterQuery('') : undefined} />}</section>
    {bookmarks.length > 0 && <section className="detail-bookmarks" aria-labelledby="bookmarks-title"><div className="detail-section-title"><h2 id="bookmarks-title">Your bookmarks</h2><Link href="/bookmarks">Manage bookmarks<ArrowUpRight size={14} /></Link></div><div>{bookmarks.map(item => <button key={item._id} onClick={() => { const index = tracks.findIndex(track => track.id === String(item.chapterId)); if (index >= 0) playFrom(index, item.seconds) }}><Bookmark size={16} /><span><strong>{item.chapterTitle}</strong>{item.note && <small>{item.note}</small>}</span><span>{formatTime(item.seconds)}</span><Play size={13} fill="currentColor" /></button>)}</div></section>}
    {seriesBooks.length > 0 && <section className="detail-series" aria-labelledby="series-title"><div className="detail-section-title"><h2 id="series-title">In this series</h2>{book.series && <Link href={`/series/${encodeURIComponent(book.series)}`}>View series<ArrowUpRight size={14} /></Link>}</div><div className="detail-series-grid">{seriesBooks.map(item => <Link key={item.id} href={`/listen/${item.id}`}><img src={fileUrl(item.coverUrl)} alt={`${item.title} cover`} loading="lazy" /><small>Book {item.seriesIndex}</small><h3>{item.title}</h3></Link>)}</div></section>}
    <footer className="detail-footer"><Headphones size={16} /><span>One more chapter?</span><Link href="/browse">Find your next listen<ArrowUpRight size={14} /></Link></footer>
  </article>
}
