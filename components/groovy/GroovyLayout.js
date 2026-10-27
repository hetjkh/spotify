import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { AudioLines, Bell, Bookmark, BookOpen, Check, ChevronDown, Folder, Headphones, Heart, History, Home, Library, ListMusic, LogOut, Plus, Search, Settings2, Sparkles, Upload, User, Users, X } from 'lucide-react'
import { useMusic } from './MusicProvider'
import { useAuth } from './AuthProvider'
import { IconButton, Modal, ThemeToggle } from './UI'
import Player from './Player'
import { BrowseSectionLinks, DashboardSectionLinks, LibrarySectionLinks, SectionNavigation, browsePaths, libraryPaths } from './SectionNavigation'
import { api, avatarUrl, fileUrl } from '@/lib/api'

function PersonAvatar({ user, className = 'avatar' }) {
  if (user?.avatar) return <img className={className} src={avatarUrl(user.avatar)} alt="" />
  return <span className={className}>{(user?.name || 'G')[0]}</span>
}

const menu = [{label:'Home',href:'/',icon:Home},{label:'Browse',href:'/browse',icon:Search},{label:'My Library',href:'/library',icon:Library},{label:'Dashboard',href:'/dashboard',icon:AudioLines},{label:'Creator',href:'/creator',icon:Upload}]

export default function GroovyLayout({ children }) {
  const router = useRouter()
  const music = useMusic()
  const auth = useAuth()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [playlistName, setPlaylistName] = useState('')
  const [notices, setNotices] = useState([])
  const [unread, setUnread] = useState(0)
  const [uploadedMatches, setUploadedMatches] = useState([])
  const path = router.asPath.split('?')[0]
  const tab = router.query.tab || 'books'
  const catalogPage = path === '/albums' || (path === '/browse' && tab === 'books')
  useEffect(() => { setQuery(router.query.searchQuery || ''); setSearchFocused(false); document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'instant' }) }, [router.asPath, router.query.searchQuery])
  useEffect(() => {
    if (!auth.user) { setNotices([]); setUnread(0); return }
    const load = () => api('/notices').then(data => { setNotices(data.notices || []); setUnread(data.unread || 0) }).catch(() => {})
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [auth.user])
  useEffect(() => {
    if (!query.trim()) { setUploadedMatches([]); return }
    const timer = setTimeout(() => api(`/books/public?q=${encodeURIComponent(query.trim())}`).then(data => setUploadedMatches(data.books || [])).catch(() => {}), 250)
    return () => clearTimeout(timer)
  }, [query])
  const search = event => { event.preventDefault(); if (query.trim()) { router.push(`/search/${encodeURIComponent(query.trim())}`); setSearchFocused(false); document.activeElement?.blur() } }
  const create = event => { event.preventDefault(); if (!playlistName.trim()) return; const playlist = music.createPlaylist(playlistName); setPlaylistName(''); setDialog(null); router.push(`/playlist/${playlist.id}`) }
  const showBrowseSections = browsePaths.includes(path) || path.startsWith('/narrator/') || path.startsWith('/series/')
  const showLibrarySections = libraryPaths.includes(path) || path.startsWith('/playlist/')
  const isActive = href => href === '/creator' ? path === '/creator' || path === '/upload' || path.startsWith('/edit/') : href === '/browse' ? browsePaths.includes(path) || ['/narrator/','/series/','/listen/','/u/'].some(prefix => path.startsWith(prefix)) : href === '/library' ? libraryPaths.includes(path) || path.startsWith('/playlist/') : path === href
  const renderNav = items => items.map(({label,href,icon:Icon}) => <span className="sidebar-item" key={href}><Link href={href} className={`sidebar-link ${isActive(href) ? 'active' : ''}`} aria-current={isActive(href) ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>{href === '/browse' && showBrowseSections && <BrowseSectionLinks />}{href === '/library' && showLibrarySections && <LibrarySectionLinks />}</span>)
  return <div className={`app-shell ${browsePaths.includes(path) ? 'browse-workspace' : ''} ${showLibrarySections ? 'library-workspace' : ''} ${music.current.id === 'idle' ? 'idle-workspace' : ''} ${path === '/' ? 'home-workspace' : `inner-workspace ${['/login','/signup','/forgot','/reset','/verify'].includes(path) ? 'auth-workspace' : ''}`}`}>
    <Head><title>Groovy — Listen to the next chapter</title><meta name="description" content="A black-and-white audiobook player. Continue listening, browse authors, and resume where you left off." /><meta name="theme-color" content="#0a0a0a" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><link rel="icon" href="/groovy.svg" type="image/svg+xml" /></Head>
    <a href="#main-content" className="skip-link">Skip to books</a>
    <aside className="sidebar"><Link href="/" className="brand" aria-label="Groovy home"><span className="brand-mark"><AudioLines size={25} strokeWidth={2.3} /></span><span>groovy<span className="brand-dot">.</span></span></Link>
      <div className="sidebar-group"><h2 className="nav-label">MENU</h2><nav aria-label="Main navigation">{renderNav(menu)}</nav></div>
      <div className="sidebar-group sidebar-guide"><span className="eyebrow">YOUR NEXT CHAPTER</span><p>Find a story in Browse.<br />Keep it in My Library.<br />Pick up from Dashboard.</p><Link className="text-link" href="/collections">Open collections</Link></div>
      <div className="sidebar-bottom"><div className="listening-note"><span className="headphone-orb"><Headphones size={20} /></span><h3>Keep listening.</h3><p>Books, authors, and<br />chapters in one place.</p><Link href="/creator">My uploads<Sparkles size={13} /></Link></div><button className="sidebar-profile" onClick={() => setDialog('profile')}><PersonAvatar user={auth.user} /><span><strong>{auth.user?.name || 'Guest'}</strong><small>{auth.user ? 'Your profile' : 'Sign in to publish'}</small></span><Settings2 size={16} /></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><Link href="/" className="mobile-brand" aria-label="Groovy home"><AudioLines size={24} /><span>groovy.</span></Link><nav className="top-tabs" aria-label="Content type">{[{ id: 'books', name: 'Browse', href: '/browse' }, { id: 'library', name: 'My Library', href: '/library' }].map(item => <Link key={item.id} className={path === item.href ? 'selected' : ''} href={item.href}>{item.name}</Link>)}</nav>
      <div className="search-container"><form className="search-box" role="search" onSubmit={search}><Search size={17} /><input aria-label="Search books" placeholder="Search books, authors, chapters..." value={query} onChange={event => setQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 180)} onKeyDown={event => { if (event.key === 'Escape') setSearchFocused(false) }} />{query ? <IconButton label="Clear search" onClick={() => setQuery('')}><X size={14} /></IconButton> : <span className="search-shortcut">⌕</span>}</form><AnimatePresence>{searchFocused && query.trim() && <motion.div className="search-suggestions" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><span className="eyebrow">QUICK FIND</span>{uploadedMatches.slice(0, 6).map(book => <Link key={book.id} href={`/listen/${book.id}`} onClick={() => setSearchFocused(false)}><img src={fileUrl(book.coverUrl)} alt="" /><span><strong>{book.title}</strong><small>{book.authorName}</small></span><BookOpen size={15} /></Link>)}{!uploadedMatches.length && query.trim() && <p>No matches yet. Try another title or author.</p>}<Link href={`/search/${encodeURIComponent(query.trim())}`} onClick={() => setSearchFocused(false)} className="search-all">See all results<ChevronDown size={14} /></Link></motion.div>}</AnimatePresence></div>
      <div className="topbar-actions"><ThemeToggle /><IconButton label="Search" className="mobile-search-button" onClick={() => router.push('/search')}><Search size={21} /></IconButton><IconButton label="Notifications" className="notification-button" onClick={() => { setDialog('notifications'); api('/notices/read', { method: 'POST' }).then(() => setUnread(0)).catch(() => {}) }}><Bell size={19} />{unread > 0 && <span className="notification-dot" />}</IconButton><span className="topbar-divider" />{auth.user ? <button className="profile-button" onClick={() => setDialog('profile')}><PersonAvatar user={auth.user} /><span>{auth.user.name}</span><ChevronDown size={13} /></button> : <Link className="profile-button" href="/login">Sign in</Link>}</div>
    </header>
    <div className="workspace"><main id="main-content" className="main-content">{path !== '/' ? <div className="page-transition">{showBrowseSections && <BrowseSectionLinks className="browse-subnav-mobile" />}{showLibrarySections && <LibrarySectionLinks className="browse-subnav-mobile" />}{path === '/dashboard' && <DashboardSectionLinks />}{!catalogPage && <SectionNavigation />}{children}</div> : (<AnimatePresence mode="wait" initial={false}><motion.div className="page-transition" key={router.asPath} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22 }}>{showBrowseSections && <BrowseSectionLinks className="browse-subnav-mobile" />}{children}</motion.div></AnimatePresence>)}</main><Player /></div></div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{menu.map(({label,href,icon:Icon}) => <Link key={href} href={href} className={isActive(href) ? 'active' : ''} aria-current={isActive(href) ? 'page' : undefined}><Icon size={21} /><span>{label}</span></Link>)}</nav>
    <AnimatePresence>{music.toast && <motion.div className="toast" role="status" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}><Check size={17} />{music.toast}</motion.div>}{dialog === 'playlist' && <Modal title="A listening list" onClose={() => setDialog(null)}><div className="playlist-modal-art"><ListMusic size={44} /></div><p className="modal-description">Arrange selected chapters into a chapter collection.</p><form onSubmit={create}><label className="field-label" htmlFor="playlist-name">List name</label><input id="playlist-name" className="text-field" value={playlistName} onChange={event => setPlaylistName(event.target.value)} maxLength={60} placeholder="Give your list a name" required /><button className="button button-primary full-width" disabled={!playlistName.trim()} type="submit"><Plus size={17} />Create list</button></form></Modal>}{dialog === 'notifications' && <Modal title="A little something new" onClose={() => setDialog(null)}>{notices.length ? notices.map(item => <div className="notification-card" key={item._id}><span className="notification-icon"><Sparkles size={23} /></span><div><h3>{item.title}</h3><p>{item.text}</p>{item.link && <Link className="text-link" href={item.link} onClick={() => setDialog(null)}>Open</Link>}</div></div>) : <p className="muted">No notifications yet. Follow someone, then they publish a book.</p>}<p className="notification-end"><Check size={14} />You&apos;re all caught up</p></Modal>}{dialog === 'profile' && <Modal className="profile-modal" title="Your space" onClose={() => setDialog(null)}><div className="profile-detail"><PersonAvatar user={auth.user} className="avatar" /><h3>{auth.user?.name || 'Guest'}</h3><p>{auth.user?.email || 'Sign in to upload and publish books.'}</p></div><div className="profile-stats"><span><strong>{music.liked.length}</strong>liked chapters</span><span><strong>{music.playlists.length}</strong>chapter collections</span><span><strong>{music.history.length}</strong>chapters heard</span></div>{auth.user ? <nav className="profile-links" aria-label="Account"><Link href="/profile" onClick={() => setDialog(null)}><User size={18} />Profile &amp; settings</Link><Link href="/dashboard" onClick={() => setDialog(null)}><AudioLines size={18} />Open dashboard</Link><Link href="/creator" onClick={() => setDialog(null)}><Upload size={18} />My uploads</Link><button type="button" onClick={() => { auth.logout(); setDialog(null) }}><LogOut size={18} />Sign out</button></nav> : <Link className="button studio-button" href="/login" onClick={() => setDialog(null)}>Sign in</Link>}</Modal>}</AnimatePresence>
  </div>
}
