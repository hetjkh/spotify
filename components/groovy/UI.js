import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronRight, Heart, ListPlus, Moon, MoreHorizontal, Music2, Pause, Play, Plus, Sun, X } from 'lucide-react'
import Link from 'next/link'
import { useMusic } from './MusicProvider'
import { formatTime, songs } from '@/data/groovy'

export function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem('groovy-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark')
  useEffect(() => {
    const next = readStoredTheme()
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }, [])
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('groovy-theme', next) } catch {}
  }
  return <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggle}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</IconButton>
}

export function Equalizer() { return <span className="equalizer" aria-label="Playing"><i /><i /><i /><i /></span> }

export function SectionHeading({ title, eyebrow, href, action, actionLabel = 'View all' }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{href ? <Link className="text-link" href={href}>{actionLabel}<ChevronRight size={14} /></Link> : action ? <button className="text-link" onClick={action}>{actionLabel}<ChevronRight size={14} /></button> : null}</div>
}

export function Modal({ title, children, onClose, className = '' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  useEffect(() => {
    const previousFocus = document.activeElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusables = () => dialogRef.current?.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')
    focusables()?.[0]?.focus()
    const handleKey = event => {
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current() }
      if (event.key === 'Tab') {
        const elements = focusables()
        if (!elements?.length) { event.preventDefault(); return }
        const first = elements[0], last = elements[elements.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus() }
  }, [])
  if (typeof document === 'undefined') return null
  return createPortal(<motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <motion.section ref={dialogRef} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: .25 }}>
      <div className="modal-heading"><h2 id={titleId}>{title}</h2><IconButton label="Close dialog" onClick={onClose}><X size={21} /></IconButton></div>{children}
    </motion.section>
  </motion.div>, document.body)
}

export function TrackList({ tracks, compact = false, showAlbum = false, empty = 'Your next favorite is out there.', removable, onRemove }) {
  const music = useMusic()
  const [actionsTrack, setActionsTrack] = useState(null)
  const [playlistPicker, setPlaylistPicker] = useState(false)
  if (!tracks.length) return <div className="empty-state"><Music2 size={32} /><h3>{empty}</h3><p>Explore a little. Find something that feels like you.</p><Link href="/" className="button button-primary">Discover music<ArrowUpRight size={16} /></Link></div>
  return <>
    <div className={`track-list ${compact ? 'compact' : ''} ${showAlbum ? 'with-album' : ''}`}>
      {showAlbum && <div className="track-table-heading"><span>#</span><span>Title</span><span>Album</span><span>Time</span><span /></div>}
      {tracks.map((track, index) => {
        const isCurrent = music.current.id === track.id
        return <div key={track.id} className={`track-row ${isCurrent ? 'current-track' : ''}`}>
          <button className="track-number" aria-label={`${isCurrent && music.playing ? 'Pause' : 'Play'} ${track.title}`} onClick={() => isCurrent ? music.togglePlay() : music.playTrack(track, tracks)}>{isCurrent && music.playing ? <Equalizer /> : <><span>{String(index + 1).padStart(2, '0')}</span><Play className="row-play" size={14} fill="currentColor" /></>}</button>
          <button className="track-identity" onClick={() => isCurrent ? music.togglePlay() : music.playTrack(track, tracks)} aria-label={`${isCurrent && music.playing ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`}><img src={track.image} alt="" loading="lazy" /><span><strong>{track.title}</strong><small>{track.artist}</small></span></button>
          {showAlbum && <span className="track-album">{track.album}</span>}
          <span className="track-time">{formatTime(isCurrent ? music.duration : track.duration)}</span>
          <div className="track-actions"><IconButton label={`${music.liked.includes(track.id) ? 'Unlike' : 'Like'} ${track.title}`} aria-pressed={music.liked.includes(track.id)} className={music.liked.includes(track.id) ? 'is-liked' : ''} onClick={() => music.toggleLike(track.id)}><Heart size={16} fill={music.liked.includes(track.id) ? 'currentColor' : 'none'} /></IconButton>{removable ? <IconButton label={`Remove ${track.title}`} onClick={() => onRemove(track)}><X size={16} /></IconButton> : <IconButton label={`More options for ${track.title}`} onClick={() => { setActionsTrack(track); setPlaylistPicker(false) }}><MoreHorizontal size={17} /></IconButton>}</div>
        </div>
      })}
    </div>
    <AnimatePresence>{actionsTrack && <Modal title={playlistPicker ? 'Add to a playlist' : actionsTrack.title} onClose={() => setActionsTrack(null)}>
      {playlistPicker ? <div className="menu-options">{music.playlists.length ? music.playlists.map(playlist => <button key={playlist.id} onClick={() => { music.addToPlaylist(playlist.id, actionsTrack); setActionsTrack(null) }}><Music2 size={18} />{playlist.name}{playlist.trackIds.includes(actionsTrack.id) && <Check size={16} />}</button>) : <p className="muted">Create a playlist using the + button in your library first.</p>}</div> : <div className="menu-options"><button onClick={() => { music.addToQueue(actionsTrack); setActionsTrack(null) }}><ListPlus size={19} />Add to queue</button><button onClick={() => { music.toggleLike(actionsTrack.id); setActionsTrack(null) }}><Heart size={19} />{music.liked.includes(actionsTrack.id) ? 'Remove from favorites' : 'Save to favorites'}</button><button onClick={() => setPlaylistPicker(true)}><Plus size={19} />Add to playlist</button></div>}
    </Modal>}</AnimatePresence>
  </>
}

export function MixCard({ mix, index = 0 }) {
  const music = useMusic()
  return <motion.article className="mix-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06, duration: .4 }}>
    <div className="mix-art"><Link href={`/playlist/${mix.id}`} aria-label={`Open ${mix.name}`}><img src={mix.image} alt="" loading="lazy" /><div className="mix-art-shade" /><span className="mix-logo">groovy.</span><div className="mix-art-copy"><span>{mix.tag || 'YOUR MIX'}</span><strong>{mix.name}</strong></div></Link><button className="mix-play" aria-label={`Play ${mix.name}`} onClick={() => { const tracks = mix.trackIds.map(id => songs.find(song => song.id === id)).filter(Boolean); if (tracks.length) music.playTrack(tracks[0], tracks) }}><Play size={19} fill="currentColor" /></button></div>
    <Link href={`/playlist/${mix.id}`} className="mix-name">{mix.name}</Link><p>{mix.subtitle}</p>
  </motion.article>
}

export function ArtistCard({ artist }) {
  return <Link href={`/artists?artist=${artist.id}`} className="artist-card"><div className="artist-picture"><img src={artist.image} alt={artist.name} loading="lazy" /><span className="artist-open"><ArrowUpRight size={20} /></span></div><strong>{artist.name}</strong><span>{artist.listeners} listeners</span></Link>
}
