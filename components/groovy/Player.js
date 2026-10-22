import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Heart, ListMusic, Maximize2, MoreHorizontal, Pause, Play, Radio, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useMusic } from './MusicProvider'
import { Equalizer, IconButton, Modal, TrackList } from './UI'
import { formatTime } from '@/data/groovy'

export function PlayerContent({ expanded = false, onQueue }) {
  const music = useMusic()
  const liked = music.liked.includes(music.current.id)
  const [previousVolume, setPreviousVolume] = useState(.65)
  const toggleMute = () => { if (music.volume) { setPreviousVolume(music.volume); music.setVolume(0) } else music.setVolume(previousVolume || .65) }
  return <div className={`player-content ${expanded ? 'expanded' : ''}`}>
    <div className="player-art-wrap"><AnimatePresence mode="wait"><motion.img key={music.current.image} className="player-art" src={music.current.image} alt={`${music.current.album} artwork`} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .98 }} transition={{ duration: .25 }} /></AnimatePresence><span className="art-badge"><span /> ORIGINAL DEMO</span></div>
    <div className="now-playing-info"><div><h2>{music.current.title}</h2><p>{music.current.artist}</p></div><IconButton label={liked ? 'Unlike current track' : 'Like current track'} aria-pressed={liked} className={liked ? 'is-liked' : ''} onClick={() => music.toggleLike(music.current.id)}><Heart size={21} fill={liked ? 'currentColor' : 'none'} /></IconButton></div>
    <p className="player-album">{music.current.album}</p>
    <div className="progress-control"><input aria-label="Track progress" type="range" min="0" max={music.duration || 64} step=".1" value={Math.min(music.time, music.duration || 64)} onChange={event => music.seek(event.target.value)} style={{ '--progress': `${music.duration ? music.time / music.duration * 100 : 0}%` }} /><div className="time-labels"><span>{formatTime(music.time)}</span><span>{formatTime(music.duration)}</span></div></div>
    <div className="playback-controls"><IconButton label="Shuffle" aria-pressed={music.shuffle} className={music.shuffle ? 'active-control' : ''} onClick={() => music.setShuffle(!music.shuffle)}><Shuffle size={18} /></IconButton><IconButton label="Previous track" onClick={music.previous}><SkipBack size={22} fill="currentColor" /></IconButton><button className={`main-play ${music.loading ? 'is-loading' : ''}`} aria-label={music.playing ? 'Pause music' : 'Play music'} onClick={music.togglePlay}>{music.playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</button><IconButton label="Next track" onClick={() => music.next()}><SkipForward size={22} fill="currentColor" /></IconButton><IconButton label={`Repeat: ${music.repeat}`} className={music.repeat !== 'off' ? 'active-control' : ''} aria-pressed={music.repeat !== 'off'} onClick={() => music.setRepeat(music.repeat === 'off' ? 'all' : music.repeat === 'all' ? 'one' : 'off')}>{music.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</IconButton></div>
    <div className="volume-control"><IconButton label={music.volume ? 'Mute' : 'Unmute'} onClick={toggleMute}>{music.volume ? <Volume2 size={17} /> : <VolumeX size={17} />}</IconButton><input aria-label="Volume" type="range" min="0" max="1" step=".01" value={music.volume} onChange={event => music.setVolume(Number(event.target.value))} style={{ '--progress': `${music.volume * 100}%` }} /><span>{Math.round(music.volume * 100)}%</span></div>
    <button className="player-output" onClick={onQueue}><Radio size={14} /><span>Listening on this device</span><ListMusic size={16} /></button>
  </div>
}

export default function Player() {
  const music = useMusic()
  const [expanded, setExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const currentIndex = music.queue.findIndex(track => track.id === music.current.id)
  const upcoming = music.queue.slice(currentIndex + 1)
  return <>
    <aside className="player-sidebar" aria-label="Music player">
      <div className="player-heading"><h2>Now playing</h2><IconButton label="Expand player" onClick={() => setExpanded(true)}><Maximize2 size={16} /></IconButton></div>
      <PlayerContent onQueue={() => setShowQueue(true)} />
      <div className="up-next"><div className="section-heading"><h2>Up next</h2><button className="text-link" onClick={() => setShowQueue(true)}>Queue<ListMusic size={14} /></button></div><div className="queue-preview">{upcoming.slice(0, 3).map((track, index) => <button key={track.id} className="queue-item" onClick={() => music.playTrack(track)}><span className="queue-number">{String(index + 1).padStart(2, '0')}</span><img src={track.image} alt="" /><span className="queue-copy"><strong>{track.title}</strong><small>{track.artist}</small></span><Play size={13} /></button>)}{!upcoming.length && <p className="muted queue-finished">You&apos;re all caught up. Find your next feeling.</p>}</div></div>
      <div className="player-footer"><span className="online-dot" />Good music. No interruptions.</div>
    </aside>
    <div className="mini-player"><button className="mini-track" onClick={() => setExpanded(true)} aria-label="Open full screen player"><img src={music.current.image} alt="" /><span><strong>{music.current.title}</strong><small>{music.current.artist}</small></span>{music.playing && <Equalizer />}</button><IconButton label={music.playing ? 'Pause music' : 'Play music'} onClick={music.togglePlay}>{music.playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</IconButton><IconButton label="Next track" onClick={() => music.next()}><SkipForward size={21} fill="currentColor" /></IconButton><div className="mini-progress" style={{ width: `${music.duration ? music.time / music.duration * 100 : 0}%` }} /></div>
    <AnimatePresence>{expanded && <Modal title="Now playing" className="full-player-modal" onClose={() => setExpanded(false)}><div className="full-player-label">A LITTLE ESCAPE, JUST FOR YOU</div><PlayerContent expanded onQueue={() => { setExpanded(false); setShowQueue(true) }} /><button className="collapse-player text-link" onClick={() => setExpanded(false)}><ChevronDown size={18} />Back to discovering</button></Modal>}{showQueue && <Modal title="Your queue" className="queue-modal" onClose={() => setShowQueue(false)}><p className="modal-description">Playing from your current selection · {music.queue.length} tracks</p><TrackList tracks={music.queue} compact removable onRemove={track => { if (track.id === music.current.id) { music.notify('The current track stays in your queue'); return } music.setQueue(music.queue.filter(item => item.id !== track.id)) }} /></Modal>}</AnimatePresence>
  </>
}
