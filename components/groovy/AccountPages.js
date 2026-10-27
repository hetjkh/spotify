import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronUp, Eye, EyeOff, FileAudio, Globe, Headphones, ImagePlus, Lock, MapPin, Pencil, Play, Plus, Trash2, Upload, UserRound } from 'lucide-react'
import BookEditor from './BookEditor'
import BookLibrary from './BookLibrary'
import ListeningDashboard from './ListeningDashboard'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'
import { API, api, avatarUrl, fileUrl, toPlayerTracks } from '@/lib/api'
import { CollectionTools, FilteredBooks, matches, NoResults } from './WorkspaceUI'

function PageIntro({ eyebrow, title, description, children }) {
  return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><div><h1>{title}</h1>{children}</div>{description && <p>{description}</p>}</div>
}

function StudioFormSection({ number, title, description, children }) {
  return <section className="studio-form-section"><div className="studio-section-heading"><span className="studio-section-number">{number}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="studio-section-fields">{children}</div></section>
}

function AuthForm({ mode }) {
  const auth = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') await auth.signup(name, email, password)
      else await auth.login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return <div className="auth-experience"><aside className="auth-story"><span className="auth-emblem"><Headphones size={28} /></span><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Good stories.<br /> Always with you.</h2><p>A library of voices, a moment for yourself. Pick up right where you left off.</p><div className="auth-book-art"><img src={fileUrl('/uploads/covers/demo-alice.jpg')} alt="Alice's Adventures in Wonderland" /><img src={fileUrl('/uploads/covers/demo-pride.jpg')} alt="Pride and Prejudice" /><img src={fileUrl('/uploads/covers/demo-dracula.jpg')} alt="Dracula" /></div><div className="auth-benefits"><span><BookOpen size={16} />Build your own library</span><span><Headphones size={16} />Listen at your own pace</span><span><Lock size={16} />Keep your place across devices</span></div></aside><div className="auth-form-panel"><Link className="back-link" href="/albums">Explore the catalog <ArrowRight size={14} /></Link><PageIntro eyebrow={mode === 'signup' ? 'MAKE ROOM FOR MORE STORIES' : 'WELCOME BACK'} title={mode === 'signup' ? 'Create your account' : 'Sign in to Groovy'} description={mode === 'signup' ? 'Your books, bookmarks, and listening lists in one place.' : 'Your library and your next chapter are waiting.'} />
    <form className="account-form" onSubmit={submit}>
      {mode === 'signup' && <label className="field-label">Name<input className="text-field" autoComplete="name" placeholder="Your full name" value={name} onChange={event => setName(event.target.value)} required minLength={2} /></label>}
      <label className="field-label">Email<input className="text-field" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></label>
      <label className="field-label" htmlFor="auth-password">Password</label><div className="password-input"><input id="auth-password" className="text-field" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={mode === 'signup' ? 8 : 1} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      {error && <p className="form-alert" role="alert">{error}</p>}
      {mode === 'login' && <p className="muted"><Link href="/forgot">Forgot password?</Link></p>}
      <button className="button button-primary full-width" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      {auth.google && <a className="button button-quiet full-width" href={`${API}/auth/google`}>Continue with Google</a>}
      <p className="muted">{mode === 'signup' ? <>Already have an account? <Link href="/login">Sign in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}</p>
    </form><p className="auth-footnote"><Lock size={13} />Your listening space, saved securely.</p></div></div>
}

export function LoginPage() { return <AuthForm mode="login" /> }
export function SignupPage() { return <AuthForm mode="signup" /> }

export function ForgotPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const submit = async event => {
    event.preventDefault()
    try { await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }); setMessage('If an account exists, password reset instructions will be sent to its email address.') } catch (error) { setMessage(error.message) }
  }
  return <><PageIntro title="Reset your password." /><form className="page-search account-form" onSubmit={submit}><input aria-label="Email address" autoComplete="email" className="text-field" type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="Email" /><button className="button button-primary" type="submit">Send reset link</button>{message && <p className="muted">{message}</p>}</form></>
}

export function ResetPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const submit = async event => {
    event.preventDefault()
    try { await api('/auth/reset', { method: 'POST', body: JSON.stringify({ token: router.query.token, password }) }); setMessage('Password updated. You can sign in now.') } catch (error) { setMessage(error.message) }
  }
  return <><PageIntro title="Choose a new password." /><form className="page-search account-form" onSubmit={submit}><input aria-label="New password" autoComplete="new-password" className="text-field" type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /><button className="button button-primary" type="submit">Save password</button>{message && <p className="muted">{message} <Link href="/login">Sign in</Link></p>}</form></>
}

export function VerifyPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Checking…')
  useEffect(() => {
    if (!router.query.token) return
    api('/auth/verify', { method: 'POST', body: JSON.stringify({ token: router.query.token }) }).then(() => setMessage('Email verified.')).catch(err => setMessage(err.message))
  }, [router.query.token])
  return <PageIntro title="Email verification" description={message} />
}

export function UploadDashboard() {
  const [query, setQuery] = useState('')
  const [visibility, setVisibility] = useState('')
  const auth = useAuth()
  const router = useRouter()
  const music = useMusic()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = () => api('/me/dashboard').then(setData).catch(err => setError(err.message))
  useEffect(() => {
    if (!auth.ready) return
    if (!auth.user) { router.replace('/login'); return }
    load()
    const timer = setInterval(load, 8000)
    return () => clearInterval(timer)
  }, [auth.ready, auth.user])
  if (!auth.user) return <p className="muted">Sign in to open your dashboard.</p>
  if (error) return <p className="muted">{error}</p>
  if (!data) return <p className="muted">Loading dashboard…</p>
  const toggle = async book => {
    await api(`/books/${book.id}`, { method: 'PATCH', body: JSON.stringify({ visibility: book.visibility === 'public' ? 'private' : 'public' }) })
    load()
  }
  const remove = async book => {
    if (!confirm(`Delete “${book.title}”?`)) return
    await api(`/books/${book.id}`, { method: 'DELETE' })
    load()
  }
  const play = book => {
    const tracks = toPlayerTracks(book)
    if (tracks[0]) {
      music.playTrack(tracks[0], tracks)
      api(`/books/${book.id}/play`, { method: 'POST', body: JSON.stringify({}) }).catch(() => {})
    }
  }
  const books = data.books.filter(book => matches(book, query) && (!visibility || book.visibility === visibility))
  return <div className="creator-studio">
    <header className="channel-stage">
      <div className="page-intro">
        <span className="eyebrow">CREATOR</span>
        <h1>Hello, {auth.user.name.split(' ')[0]}.</h1>
        <p>Publish a book, or change who can hear the ones you already uploaded.</p>
        <Link className="button studio-button" href="/upload"><Plus size={16} />Upload a book</Link>
      </div>
    </header>
    <div className="creator-metrics" aria-label="Upload summary">
      <span><strong>{data.stats.books}</strong>Books</span>
      <span><strong>{data.stats.publicBooks}</strong>Public</span>
      <span><strong>{data.stats.plays}</strong>Plays</span>
      <span><strong>{data.stats.likes}</strong>Likes</span>
      <span><strong>{data.stats.uniqueListeners}</strong>Listeners</span>
      <span><strong>{data.stats.live}</strong>Live now</span>
    </div>
    {!data.books.length && <p className="muted">No books yet. Upload your first chapter.</p>}
    <CollectionTools query={query} onQuery={setQuery} count={books.length} placeholder="Search your uploads..." />
    <nav className="filter-tabs creator-filters" aria-label="Upload visibility">{['','public','private'].map(value => <button key={value} className={value === visibility ? 'selected' : ''} onClick={() => setVisibility(value)}>{value || 'All uploads'}</button>)}</nav>
    <div className="creator-shelf">{books.map(book => <article key={book.id} className="creator-card">
      <button className="creator-cover" type="button" aria-label={`Play ${book.title}`} onClick={() => play(book)}><img src={fileUrl(book.coverUrl)} alt="" /><span><Play size={18} fill="currentColor" /></span></button>
      <h3>{book.title}</h3>
      <p>{book.genre} · {book.plays} plays · {book.live} live</p>
      <div className="creator-actions">
        <button type="button" aria-label={book.visibility === 'public' ? `Make ${book.title} private` : `Make ${book.title} public`} onClick={() => toggle(book)}>{book.visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />}</button>
        <Link href={`/edit/${book.id}`} aria-label={`Edit ${book.title}`}><Pencil size={16} /></Link>
        <button type="button" aria-label={`Delete ${book.title}`} onClick={() => remove(book)}><Trash2 size={16} /></button>
      </div>
    </article>)}</div>
  </div>
}

export function DashboardPage() {
  return <ListeningDashboard />
}

const BOOK_GENRES = ['Fiction', 'Mystery', 'Literary', 'Fantasy', 'Sci-fi', 'Romance', 'Thriller', 'Self-help', 'Biography', 'History', 'Kids', 'Business']
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese']
const chapterId = () => `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const prettyFile = name => String(name || '').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')

export function UploadPage() {
  const auth = useAuth()
  const router = useRouter()
  const coverInput = useRef(null)
  const bulkInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [narrator, setNarrator] = useState('')
  const [genre, setGenre] = useState('Fiction')
  const [language, setLanguage] = useState('English')
  const [series, setSeries] = useState('')
  const [seriesIndex, setSeriesIndex] = useState('1')
  const [sampleChapter, setSampleChapter] = useState('1')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [cover, setCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [chapters, setChapters] = useState([{ id: chapterId(), title: 'Chapter 1', file: null }])
  useEffect(() => { if (auth.ready && !auth.user) router.replace('/login') }, [auth.ready, auth.user])
  useEffect(() => { if (auth.user) { setAuthorName(auth.user.name); setNarrator(auth.user.name) } }, [auth.user])
  const setCoverFile = file => {
    setCover(file)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(file ? URL.createObjectURL(file) : '')
  }
  const addChapter = files => {
    const incoming = files?.length ? [...files] : [null]
    setChapters(current => {
      const next = [...current]
      incoming.forEach(file => {
        const empty = next.findIndex(item => !item.file)
        const item = { id: chapterId(), title: file ? prettyFile(file.name) : `Chapter ${next.length + 1}`, file }
        if (empty >= 0 && file) next[empty] = { ...next[empty], file, title: next[empty].title || prettyFile(file.name) }
        else next.push(item)
      })
      return next
    })
  }
  const updateChapter = (id, patch) => setChapters(current => current.map(item => item.id === id ? { ...item, ...patch } : item))
  const moveChapter = (index, dir) => setChapters(current => {
    const next = [...current]
    const target = index + dir
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const submit = async event => {
    event.preventDefault()
    const ready = chapters.filter(item => item.file)
    if (!ready.length) { setError('Add at least one chapter audio file'); return }
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('authorName', authorName)
      form.append('narrator', narrator)
      form.append('genre', genre)
      form.append('language', language)
      form.append('series', series)
      form.append('seriesIndex', seriesIndex)
      form.append('sampleChapter', sampleChapter)
      form.append('year', year)
      form.append('description', description)
      form.append('visibility', visibility)
      if (cover) form.append('cover', cover)
      ready.forEach(item => {
        form.append('audio', item.file)
        form.append('chapterTitles', item.title || item.file.name)
      })
      await api('/books', { method: 'POST', body: form })
      router.push('/creator')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  if (!auth.ready) return <p className="muted">Loading…</p>
  if (!auth.user) return <><PageIntro eyebrow="ADD AUDIO" title="Sign in to upload." description="Your books stay on your dashboard until you make them public." /><Link className="button button-primary" href="/login">Sign in</Link></>
  return <form className="upload-studio form-studio book-upload-studio" onSubmit={submit}>
    <header className="studio-page-heading"><div><span className="studio-form-eyebrow"><Headphones size={13} />CREATOR STUDIO</span><h1>Upload a book.</h1><p>Add your cover, tell your story, and bring every chapter to life.</p></div><button className="button button-primary studio-form-primary" disabled={busy} type="submit"><Upload size={16} />{busy ? 'Uploading...' : 'Publish to my shelf'}</button></header>
    <div className="studio-form-layout">
      <aside className="studio-form-sidebar">
        <section className="studio-cover-panel"><div className="studio-side-heading"><ImagePlus size={16} /><h2>Book cover</h2></div><p>Give your story a first impression.</p>
          <button type="button" className={`studio-cover-picker ${coverPreview ? 'has-cover' : ''}`} aria-label={coverPreview ? 'Change book cover' : 'Add book cover'} onClick={() => coverInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file?.type.startsWith('image/')) setCoverFile(file) }}>
            {coverPreview ? <img src={coverPreview} alt="Cover preview" /> : <span><span className="studio-picker-icon"><ImagePlus size={27} strokeWidth={1.4} /></span><strong>Add your cover</strong><small>Drop an image here<br />or click to browse</small></span>}
          </button><input ref={coverInput} aria-label="Book cover file" type="file" accept="image/*" hidden onChange={event => setCoverFile(event.target.files?.[0] || null)} />
          <button className="studio-change-image" type="button" onClick={() => coverInput.current?.click()}><Upload size={13} />{coverPreview ? 'Change cover' : 'Choose an image'}</button><small className="studio-image-hint">JPG, PNG or WebP. A portrait cover works beautifully.</small>
        </section>
        <section className="studio-visibility-panel"><div className="studio-side-heading"><Eye size={16} /><h2>Who can listen?</h2></div><div className="studio-visibility-options" role="group" aria-label="Book visibility">{[['private', Lock, 'Private', 'Only you can access this book.'], ['public', Globe, 'Public', 'Available for everyone to discover.']].map(([value, Icon, label, hint]) => <button key={value} type="button" aria-pressed={visibility === value} onClick={() => setVisibility(value)}><Icon size={17} /><span><strong>{label}</strong><small>{hint}</small></span><span className="studio-choice-dot" aria-hidden="true">{visibility === value && <Check size={11} strokeWidth={3} />}</span></button>)}</div><p className="studio-sidebar-note">You can change this later from My uploads.</p></section>
      </aside>
      <div className="studio-form-main">
        <StudioFormSection number="01" title="The essentials" description="Help listeners find the story they are looking for.">
          <label className="field-label">Title<input className="text-field studio-title-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="Give your book a title" required /></label>
          <div className="studio-field-row"><label className="field-label">Author<input className="text-field" value={authorName} onChange={event => setAuthorName(event.target.value)} placeholder="Who wrote the story?" /></label><label className="field-label">Narrator<input className="text-field" value={narrator} onChange={event => setNarrator(event.target.value)} placeholder="The voice behind the story" /></label></div>
          <div className="studio-field-row"><label className="field-label">Genre<select aria-label="Genre" className="text-field" value={genre} onChange={event => setGenre(event.target.value)}>{BOOK_GENRES.map(item => <option key={item}>{item}</option>)}</select></label><label className="field-label">Language<select aria-label="Language" className="text-field" value={language} onChange={event => setLanguage(event.target.value)}>{LANGUAGES.map(item => <option key={item}>{item}</option>)}</select></label></div>
          <label className="field-label">Description<textarea className="text-field" rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Set the scene. What should a listener know before pressing play?" /></label>
        </StudioFormSection>
        <StudioFormSection number="02" title="Series & edition" description="The little details that keep your catalog in order."><div className="studio-field-row"><label className="field-label"><span>Series <small>Optional</small></span><input className="text-field" value={series} onChange={event => setSeries(event.target.value)} placeholder="The name of your series" /></label><label className="field-label">Book number<input className="text-field" type="number" min="1" value={seriesIndex} onChange={event => setSeriesIndex(event.target.value)} /></label></div><div className="studio-field-row"><label className="field-label">Sample chapter<input className="text-field" type="number" min="1" value={sampleChapter} onChange={event => setSampleChapter(event.target.value)} /></label><label className="field-label">Year<input className="text-field" value={year} onChange={event => setYear(event.target.value)} /></label></div></StudioFormSection>
      </div>
    </div>
    <section className="chapter-studio studio-form-section"><div className="studio-section-heading"><span className="studio-section-number">03</span><div><h2>The chapters</h2><p>Add your recordings in the order you want them heard.</p></div><span className="studio-section-count">{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</span></div><div className="studio-chapter-toolbar"><span><FileAudio size={16} />MP3, WAV, OGG, M4A or FLAC</span><div className="chapter-heading-actions"><button type="button" className="button button-quiet" onClick={() => bulkInput.current?.click()}><Upload size={14} />Add audio files</button><button type="button" className="button button-quiet" onClick={() => addChapter()}><Plus size={14} />Add chapter</button></div></div><input ref={bulkInput} aria-label="Add audio files" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" multiple hidden onChange={event => { addChapter(event.target.files); event.target.value = '' }} />
      <div className="chapter-list">{chapters.map((chapter, index) => <article className="chapter-row" key={chapter.id}><span className="chapter-index">{String(index + 1).padStart(2, '0')}</span><label className="field-label">Chapter name<input className="text-field" value={chapter.title} onChange={event => updateChapter(chapter.id, { title: event.target.value })} placeholder={`Chapter ${index + 1}`} /></label><label className={`chapter-file ${chapter.file ? 'has-file' : ''}`}><input aria-label={`Audio for chapter ${index + 1}`} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" hidden onChange={event => { const file = event.target.files?.[0]; if (file) updateChapter(chapter.id, { file, title: chapter.title || prettyFile(file.name) }) }} /><FileAudio size={16} /><span>{chapter.file ? chapter.file.name : 'Choose audio file'}</span>{chapter.file && <Check size={14} />}</label><div className="chapter-move"><button type="button" className="icon-button" aria-label="Move chapter up" disabled={!index} onClick={() => moveChapter(index, -1)}><ChevronUp size={16} /></button><button type="button" className="icon-button" aria-label="Move chapter down" disabled={index === chapters.length - 1} onClick={() => moveChapter(index, 1)}><ChevronDown size={16} /></button><button type="button" className="icon-button" aria-label="Remove chapter" disabled={chapters.length === 1} onClick={() => setChapters(current => current.length === 1 ? current : current.filter(item => item.id !== chapter.id))}><Trash2 size={16} /></button></div></article>)}</div>
    </section>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <footer className="studio-form-footer"><div><span className="studio-footer-icon">{visibility === 'private' ? <Lock size={17} /> : <Globe size={17} />}</span><span><strong>{visibility === 'private' ? 'A space just for you' : 'Ready for the listening room'}</strong><small>{chapters.filter(item => item.file).length} recordings ready &middot; {visibility === 'private' ? 'Private book' : 'Public book'}</small></span></div><button className="button button-primary studio-form-primary" disabled={busy} type="submit"><Upload size={16} />{busy ? 'Uploading...' : 'Publish to my shelf'}</button></footer>
  </form>
}

const ROLES = ['Listener', 'Author', 'Narrator', 'Publisher']

export function ProfilePage() {
  const auth = useAuth()
  const router = useRouter()
  const photoInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasPublicBooks,setHasPublicBooks] = useState(false)
  useEffect(() => { if (auth.user) api('/books/mine').then(data => setHasPublicBooks(data.books.some(book => book.visibility === 'public'))).catch(() => {}); else setHasPublicBooks(false) },[auth.user?.id])
  const [photo, setPhoto] = useState(null)
  const [profileReady, setProfileReady] = useState(null)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ name: '', bio: '', location: '', website: '', role: 'Listener', favoriteGenre: 'Fiction', languages: 'English', pronouns: '' })
  useEffect(() => { if (auth.ready && !auth.user) router.replace('/login') }, [auth.ready, auth.user])
  useEffect(() => {
    if (!auth.user) return
    setForm({
      name: auth.user.name || '',
      bio: auth.user.bio || '',
      location: auth.user.location || '',
      website: auth.user.website || '',
      role: auth.user.role || 'Listener',
      favoriteGenre: auth.user.favoriteGenre || 'Fiction',
      languages: auth.user.languages || 'English',
      pronouns: auth.user.pronouns || '',
    })
    setPreview(auth.user.avatar ? avatarUrl(auth.user.avatar) : '')
    setProfileReady(auth.user.id)
  }, [auth.user])
  const setField = (key, value) => { setSaved(false); setForm(current => ({ ...current, [key]: value })) }
  const pickPhoto = file => {
    setSaved(false)
    setPhoto(file)
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : auth.user?.avatar ? avatarUrl(auth.user.avatar) : '')
  }
  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => body.append(key, value))
      if (photo) body.append('avatar', photo)
      const data = await api('/me/profile', { method: 'PATCH', body })
      await auth.refresh()
      setSaved(true)
      setPhoto(null)
      if (data.user?.avatar) setPreview(avatarUrl(data.user.avatar))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  if (!auth.ready) return <p className="muted">Loading…</p>
  if (!auth.user) return null
  if (profileReady !== auth.user.id) return <p className="muted">Loading your profile...</p>
  return <form className="upload-studio profile-studio form-studio" onSubmit={submit}>
    <header className="studio-page-heading"><div><span className="studio-form-eyebrow"><UserRound size={13} />YOUR PERSONAL SPACE</span><h1>Your profile.</h1><p>Your name, your voice, your favorite stories. Make this space yours.</p></div><div className="chapter-heading-actions">{hasPublicBooks && <Link className="button button-quiet" href={`/u/${auth.user.id}`}>View creator profile<ArrowUpRight size={14} /></Link>}<button className="button button-primary studio-form-primary" disabled={busy} type="submit"><Check size={16} />{busy ? 'Saving...' : 'Save profile'}</button></div></header>
    <div className="studio-form-layout">
      <aside className="studio-form-sidebar"><section className="studio-identity-card"><div className="studio-side-heading"><UserRound size={16} /><h2>Your profile photo</h2></div><button type="button" className="studio-avatar-picker" aria-label="Change profile photo" onClick={() => photoInput.current?.click()}>{preview ? <img src={preview} alt="Your profile" /> : <span className="studio-avatar-initial">{(form.name || 'G')[0].toUpperCase()}</span>}<span className="studio-avatar-edit"><Pencil size={13} /></span></button><input ref={photoInput} aria-label="Profile photo file" type="file" accept="image/*" hidden onChange={event => pickPhoto(event.target.files?.[0] || null)} /><h3>{form.name || 'Your name'}</h3><span className="studio-profile-role">{form.role}</span><button type="button" className="studio-change-image" onClick={() => photoInput.current?.click()}><ImagePlus size={14} />Change photo</button><small className="studio-image-hint">A square JPG or PNG works best.</small><div className="studio-account-email"><span>ACCOUNT EMAIL</span><strong>{auth.user.email}</strong><span className="studio-verification">{auth.user.emailVerified ? <Check size={12} /> : <Lock size={12} />}{auth.user.emailVerified ? 'Email verified' : 'Not verified yet'}</span></div>{!auth.user.emailVerified && <button type="button" className="button button-quiet" onClick={async () => { try { await api('/auth/verify/send', { method: 'POST' }); alert('Check your email for a verification link.') } catch (error) { alert(error.message) } }}>Send verify link</button>}</section><p className="studio-sidebar-note"><Eye size={14} />If you publish books, these details appear on your creator profile.</p></aside>
      <div className="studio-form-main">
        <StudioFormSection number="01" title="The introductions" description="What should we call you? Make your profile feel familiar."><div className="studio-field-row"><label className="field-label">Display name<input className="text-field" value={form.name} onChange={event => setField('name', event.target.value)} required minLength={2} /></label><label className="field-label">Pronouns<input className="text-field" value={form.pronouns} onChange={event => setField('pronouns', event.target.value)} placeholder="she/her, he/him, they/them" /></label></div><div className="studio-field-row"><label className="field-label">I am a<select className="text-field" value={form.role} onChange={event => setField('role', event.target.value)}>{ROLES.map(item => <option key={item}>{item}</option>)}</select></label><label className="field-label">Favorite genre<select className="text-field" value={form.favoriteGenre} onChange={event => setField('favoriteGenre', event.target.value)}>{BOOK_GENRES.map(item => <option key={item}>{item}</option>)}</select></label></div></StudioFormSection>
        <StudioFormSection number="02" title="A little about you" description="The places, languages, and stories that make you, you."><div className="studio-field-row"><label className="field-label">Location<input className="text-field" value={form.location} onChange={event => setField('location', event.target.value)} placeholder="City, country" /></label><label className="field-label">Languages<input className="text-field" value={form.languages} onChange={event => setField('languages', event.target.value)} placeholder="The languages you speak" /></label></div><label className="field-label">Website<input className="text-field" value={form.website} onChange={event => setField('website', event.target.value)} placeholder="https://your-website.com" /></label><label className="field-label"><span>Bio <small>{form.bio.length}/400</small></span><textarea aria-label="Bio" className="text-field" rows={4} maxLength={400} value={form.bio} onChange={event => setField('bio', event.target.value)} placeholder="What do you write, narrate, or love listening to?" /></label></StudioFormSection>
      </div>
    </div>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <footer className="studio-form-footer"><div><span className="studio-footer-icon">{saved ? <Check size={17} /> : <UserRound size={17} />}</span><span>{saved ? <strong role="status">Profile saved.</strong> : <strong>Your profile, your story.</strong>}<small>Keep your details up to date.</small></span></div><button className="button button-primary studio-form-primary" disabled={busy} type="submit"><Check size={16} />{busy ? 'Saving...' : 'Save profile'}</button></footer>
  </form>
}

export function PublicProfilePage() {
  const router = useRouter()
  const auth = useAuth()
  const music = useMusic()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = () => { if (router.query.id) api(`/users/${router.query.id}`).then(setData).catch(err => setError(err.message)) }
  useEffect(() => { load() }, [router.query.id])
  if (error) return <p className="muted">{error}</p>
  if (!data) return <p className="muted">Loading profile…</p>
  const { user, books, stats, following } = data
  const isSelf = auth.user && String(auth.user.id) === String(user.id)
  const follow = async () => {
    await api(`/me/follow/${user.id}`, { method: 'POST' })
    load()
  }
  return <>
    <div className="collection-hero artist-detail">
      {user.avatar ? <img className="artist-detail-portrait" src={avatarUrl(user.avatar)} alt={user.name} /> : <div className="artist-detail-portrait profile-fallback">{user.name[0]}</div>}
      <div>
        <span className="eyebrow">{user.isDemo ? 'FICTIONAL DEMO PROFILE' : user.role}{user.pronouns ? ` · ${user.pronouns}` : ''}</span>
        <h1>{user.name}</h1>
        {user.location && <p><MapPin size={14} /> {user.location}</p>}
        <p>{user.bio || 'This listener hasn’t written a bio yet.'}</p>
        <span className="collection-meta">{stats.publicBooks} public books<span>·</span>{stats.plays} plays<span>·</span>{stats.followers} followers{user.favoriteGenre ? <><span>·</span>{user.favoriteGenre}</> : null}</span>
        <div className="collection-controls">
          {isSelf ? <Link className="button button-primary" href="/profile">Edit profile</Link> : auth.user ? <button className="button button-primary" onClick={follow}>{following ? 'Following' : 'Follow'}</button> : <Link className="button button-primary" href="/login">Sign in to follow</Link>}
          {user.website && <a className="button button-quiet" href={user.website} target="_blank" rel="noreferrer">Website</a>}
        </div>
      </div>
    </div>
    <section className="made-for-you"><div className="section-heading"><h2>Public books</h2></div>
      {!books.length && <p className="muted">No public books yet.</p>}
      <FilteredBooks books={books} />
    </section>
  </>
}

export function NarratorPage() {
  const router = useRouter()
  const name = decodeURIComponent(router.query.name || '')
  const [narrators, setNarrators] = useState([])
  useEffect(() => { api('/books/narrators').then(data => setNarrators(data.narrators || [])).catch(() => {}) }, [])
  const selected = narrators.find(item => item.name === name) || (name ? { name, books: [] } : null)
  if (!name) return <><PageIntro title="Narrators." /><div className="album-grid">{narrators.map(item => <Link key={item.name} href={`/narrator/${encodeURIComponent(item.name)}`}>{item.name}</Link>)}</div></>
  return <><PageIntro title={selected.name} description="Books this narrator has read." /><FilteredBooks books={selected.books || []} /></>
}

export function SeriesPage() {
  const router = useRouter()
  const name = decodeURIComponent(router.query.name || '')
  const [books, setBooks] = useState([])
  useEffect(() => { if (name) api(`/books/series?name=${encodeURIComponent(name)}`).then(data => setBooks(data.books || [])).catch(() => {}) }, [name])
  return <><PageIntro title={name || 'Series'} description="Books in order." /><FilteredBooks books={[...books].sort((a,b) => a.seriesIndex - b.seriesIndex)} /></>
}

export function EditBookPage() { return <BookEditor /> }
export function LibraryPage() { return <BookLibrary /> }
