import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, FileAudio, FolderOpen, HardDrive, Headphones, Pause, Play, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react'
import { useMusic } from './MusicProvider'
import { formatTime } from '@/data/groovy'

const sizeLabel = bytes => bytes >= 1048576 ? `${(bytes/1048576).toFixed(1)} MB` : `${Math.max(0,Math.round(bytes/1024))} KB`

export default function ImportAudioWidget() {
  const music = useMusic()
  const input = useRef(null)
  const [dragging,setDragging] = useState(false)
  const [query,setQuery] = useState('')
  const [notice,setNotice] = useState('')
  const [noticeKind,setNoticeKind] = useState('success')
  const tracks = music.localTracks
  const filtered = tracks.filter(track => `${track.title} ${track.format || ''}`.toLowerCase().includes(query.toLowerCase()))
  const bytes = tracks.reduce((total,track) => total + (track.bytes || 0),0)
  const seconds = tracks.reduce((total,track) => total + (track.duration || 0),0)
  const reading = tracks.filter(track => track.metadataStatus === 'loading').length
  const importAudio = files => {
    if (!music.hydrated) return
    const count = files.length
    const imported = music.importFiles(files)
    const skipped = count - imported.length
    setNoticeKind(skipped ? 'info' : 'success')
    setNotice(`${imported.length} audio ${imported.length === 1 ? 'file' : 'files'} imported${skipped ? `; ${skipped} unsupported ${skipped === 1 ? 'file' : 'files'} skipped` : ''}.`)
  }
  return <section className="import-audio-widget" aria-labelledby="import-widget-title"><div className="studio-section-heading"><div><span className="studio-eyebrow">YOUR FILES. YOUR STORIES.</span><h2 id="import-widget-title">Bring your own audio</h2><p>A little corner of the dashboard for the files on your device.</p></div><span className="studio-widget-icon"><FolderOpen size={25} /></span></div>
    <div className={`import-dropzone ${dragging ? 'is-dragging' : ''}`} onDragOver={event => {event.preventDefault();if(music.hydrated)setDragging(true)}} onDragLeave={event => {if(!event.currentTarget.contains(event.relatedTarget))setDragging(false)}} onDrop={event => {event.preventDefault();setDragging(false);importAudio(event.dataTransfer.files)}}><span className="import-drop-icon"><UploadCloud size={28} /></span><div><h3>Drop a new story here</h3><p>MP3, M4A, M4B, WAV, OGG, FLAC, AAC</p></div><button className="button studio-button" disabled={!music.hydrated} onClick={() => input.current?.click()}><Plus size={16} />Import audio</button><input ref={input} type="file" aria-label="Import audio files" accept="audio/*,.mp3,.m4a,.m4b,.wav,.ogg,.flac,.aac" multiple hidden onChange={event => {importAudio(event.target.files);event.target.value=''}} /></div>
    <div className="import-overview" aria-label="Imported audio summary"><span><FileAudio size={16} /><strong>{tracks.length}</strong> files</span><span><HardDrive size={16} /><strong>{sizeLabel(bytes)}</strong> total</span><span><Headphones size={16} /><strong>{formatTime(seconds)}</strong> {reading ? 'reading duration...' : 'of audio'}</span></div>
    {notice && <p className={`import-feedback feedback-${noticeKind}`} role="status"><Check size={15} />{notice}<button aria-label="Dismiss import message" onClick={() => setNotice('')}><X size={14} /></button></p>}
    {tracks.length > 0 ? <><div className="import-list-toolbar"><label><Search size={16} /><input aria-label="Search imported audio" placeholder="Find an imported file..." value={query} onChange={event => setQuery(event.target.value)} /></label><button className="studio-link" onClick={() => {if(tracks[0])music.playTrack(tracks[0],tracks)}}><Play size={14} />Play all</button></div><div className="import-file-list">{filtered.map(track => {
      const current = music.current.id === track.id
      const percent = track.duration ? Math.min(100,Math.round((current ? music.time : music.progress[track.id] || 0)/track.duration*100)) : 0
      return <article className={`import-file ${current ? 'is-current' : ''}`} key={track.id}><button className="import-file-play" aria-label={`${current && music.playing ? 'Pause' : 'Play'} imported ${track.title}`} onClick={() => current ? music.togglePlay() : music.playTrack(track,tracks)}>{current && music.playing ? <Pause size={17} /> : <Play size={17} />}</button><div className="import-file-info"><h3>{track.title}</h3><p><span>{track.format || 'AUDIO'}</span><span>{sizeLabel(track.bytes || 0)}</span><span>{track.metadataStatus === 'loading' ? 'Reading duration...' : track.duration ? formatTime(track.duration) : 'Duration unavailable'}</span><span>{current ? music.playing ? 'Playing' : 'Paused' : track.metadataStatus === 'unavailable' ? 'Check browser format support' : 'Ready to listen'}</span></p><progress aria-label={`Imported progress ${track.title}`} value={percent} max="100" /></div><span className="import-percent">{percent}%</span><button className="icon-button danger-action" aria-label={`Remove imported ${track.title}`} onClick={() => music.removeLocalTrack(track.id)}><Trash2 size={16} /></button></article>
    })}{!filtered.length && <div className="import-no-results">No imported files match your search.<button className="studio-link" onClick={() => setQuery('')}>Clear search</button></div>}</div></> : <div className="import-empty"><FileAudio size={19} /><p>No files yet. Import an audiobook or a favorite recording to get started.</p></div>}
    <footer className="import-widget-footer"><p>Device-only imports &middot; available for this session. Re-import after a reload.</p><Link className="studio-link" href="/local">Open imported audio<ArrowUpRight size={14} /></Link></footer>
  </section>
}
