import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, ChevronDown, Download, Heart, ListMusic, Maximize2, Moon, Pause, Play, Repeat, Repeat1, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useMusic } from './MusicProvider'
import { Equalizer, IconButton, Modal, TrackList } from './UI'
import { formatTime } from '@/data/groovy'

const speeds = [.75, 1, 1.25, 1.5, 2]
const sleepOptions = [15, 30, 45, 60]

export function PlayerContent({ expanded = false, onQueue }) {
  const music = useMusic()
  const liked = music.liked.includes(music.current.id)
  const [previousVolume, setPreviousVolume] = useState(.65)
  const [showOptions, setShowOptions] = useState(false)
  const toggleMute = () => { if (music.volume) { setPreviousVolume(music.volume); music.setVolume(0) } else music.setVolume(previousVolume || .65) }
  const sleepLeft = music.sleepUntil ? Math.max(0, Math.ceil((music.sleepUntil - Date.now()) / 60000)) : 0
  return <div className={`player-content ${expanded ? 'expanded' : ''} ${showOptions ? 'show-options' : ''}`}>
    <div className="player-art-wrap"><AnimatePresence mode="wait"><motion.img key={music.current.image} className="player-art" src={music.current.image} alt={`${music.current.album} artwork`} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={{ duration: .25 }} /></AnimatePresence>{music.current.bookId ? <span className="art-badge"><span /> STREAMING</span> : null}</div>
    <div className="now-playing-info"><div><h2>{music.current.title}</h2><p>{music.current.artist}{music.current.narrator ? ` · ${music.current.narrator}` : ''}</p></div><IconButton label={liked ? 'Unlike current chapter' : 'Like current chapter'} aria-pressed={liked} className={liked ? 'is-liked' : ''} onClick={() => music.toggleLike(music.current.id)}><Heart size={21} fill={liked ? 'currentColor' : 'none'} /></IconButton></div>
    <p className="player-album">{music.current.album}</p>
    <div className="progress-control"><input aria-label="Chapter progress" type="range" min="0" max={music.duration || 64} step=".1" value={Math.min(music.time, music.duration || 64)} onChange={event => music.seek(event.target.value)} style={{ '--progress': `${music.duration ? music.time / music.duration * 100 : 0}%` }} /><div className="time-labels"><span>{formatTime(music.time)}</span><span>{formatTime(music.duration)}</span></div></div>
    <div className="playback-controls"><IconButton label="Skip back 15 seconds" onClick={() => music.skipBy(-15)}><RotateCcw size={18} /></IconButton><IconButton label="Previous chapter" onClick={music.previous}><SkipBack size={22} fill="currentColor" /></IconButton><button className={`main-play ${music.loading ? 'is-loading' : ''}`} aria-label={music.playing ? 'Pause audiobook' : 'Play audiobook'} onClick={music.togglePlay}>{music.playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</button><IconButton label="Next chapter" onClick={() => music.next()}><SkipForward size={22} fill="currentColor" /></IconButton><IconButton label="Skip forward 15 seconds" onClick={() => music.skipBy(15)}><RotateCw size={18} /></IconButton></div>
    <button type="button" className="player-options" aria-expanded={showOptions} onClick={() => setShowOptions(open => !open)}><span>{showOptions ? 'Hide options' : 'Speed & sleep'}</span><ChevronDown size={16} /></button>
    <div className="player-extras"><div className="speed-control" aria-label="Playback speed"><span className="player-extra-label">Speed</span>{speeds.map(rate => <button key={rate} className={music.playbackRate === rate ? 'active-control' : ''} aria-pressed={music.playbackRate === rate} onClick={() => music.setPlaybackRate(rate)}>{rate}x</button>)}</div><div className="sleep-control" aria-label="Sleep timer"><span className="player-extra-label">Sleep</span><Moon size={14} />{sleepOptions.map(minutes => <button key={minutes} className={music.sleepMode !== 'chapter' && sleepLeft && sleepLeft <= minutes && sleepLeft > minutes - 15 ? 'active-control' : ''} onClick={() => music.setSleep(minutes)}>{minutes}m</button>)}<button className={music.sleepMode === 'chapter' ? 'active-control' : ''} onClick={() => music.setSleep(0, 'chapter')}>Chapter</button><button onClick={() => music.setSleep(0)}>Off</button></div><div className="player-tools"><IconButton label="Bookmark this moment" onClick={() => { const note = window.prompt('Optional note for this bookmark', ''); if (note !== null) music.bookmarkHere(note) }}><Bookmark size={18} /></IconButton><IconButton label="Download this chapter" onClick={music.downloadCurrent}><Download size={18} /></IconButton><IconButton label={`Repeat: ${music.repeat}`} className={music.repeat !== 'off' ? 'active-control' : ''} aria-pressed={music.repeat !== 'off'} onClick={() => music.setRepeat(music.repeat === 'off' ? 'all' : music.repeat === 'all' ? 'one' : 'off')}>{music.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</IconButton></div></div>
    <div className="volume-control"><IconButton label={music.volume ? 'Mute' : 'Unmute'} onClick={toggleMute}>{music.volume ? <Volume2 size={17} /> : <VolumeX size={17} />}</IconButton><input aria-label="Volume" type="range" min="0" max="1" step=".01" value={music.volume} onChange={event => music.setVolume(Number(event.target.value))} style={{ '--progress': `${music.volume * 100}%` }} /><span>{Math.round(music.volume * 100)}%</span></div>
    <button className="player-output" onClick={onQueue}><ListMusic size={14} /><span>Listening on this device</span><ListMusic size={16} /></button>
  </div>
}

export default function Player() {
  const music = useMusic()
  const [expanded, setExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const currentIndex = music.queue.findIndex(track => track.id === music.current.id)
  const upcoming = music.queue.slice(currentIndex + 1)
  return <>
    <aside className="player-sidebar" aria-label="Audiobook player">
      <div className="player-heading"><h2>Now playing</h2><IconButton label="Expand player" onClick={() => setExpanded(true)}><Maximize2 size={16} /></IconButton></div>
      <PlayerContent onQueue={() => setShowQueue(true)} />
      <div className="up-next"><div className="section-heading"><h2>Chapters</h2><button className="text-link" onClick={() => setShowQueue(true)}>List<ListMusic size={14} /></button></div><div className="queue-preview">{upcoming.slice(0, 3).map((track, index) => <button key={track.id} className="queue-item" onClick={() => music.playTrack(track)}><span className="queue-number">{String(index + 1).padStart(2, '0')}</span><img src={track.image} alt="" /><span className="queue-copy"><strong>{track.title}</strong><small>{track.artist}</small></span><Play size={13} /></button>)}{!upcoming.length && <p className="muted queue-finished">End of this book. Pick another from Home.</p>}</div></div>
      <div className="player-footer"><span className="online-dot" />Resume where you left off.</div>
    </aside>
    <div className="mini-player"><button className="mini-track" onClick={() => setExpanded(true)} aria-label="Open full screen player"><img src={music.current.image} alt="" /><span><strong>{music.current.title}</strong><small>{music.current.artist}</small></span>{music.playing && <Equalizer />}</button><IconButton label={music.playing ? 'Pause audiobook' : 'Play audiobook'} onClick={music.togglePlay}>{music.playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</IconButton><IconButton label="Skip forward 15 seconds" onClick={() => music.skipBy(15)}><RotateCw size={21} /></IconButton><div className="mini-progress" style={{ width: `${music.duration ? music.time / music.duration * 100 : 0}%` }} /></div>
    <AnimatePresence>{expanded && <Modal title="Now playing" className="full-player-modal" onClose={() => setExpanded(false)}><PlayerContent expanded onQueue={() => { setExpanded(false); setShowQueue(true) }} /></Modal>}{showQueue && <Modal title="Chapters" className="queue-modal" onClose={() => setShowQueue(false)}><p className="modal-description">Playing {music.current.album} · {music.queue.length} chapters</p><TrackList tracks={music.queue} compact removable onRemove={track => { if (track.id === music.current.id) { music.notify('The current chapter stays in the list'); return } music.setQueue(music.queue.filter(item => item.id !== track.id)) }} /></Modal>}</AnimatePresence>
  </>
}
