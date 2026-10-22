import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { songs } from '@/data/groovy'

const MusicContext = createContext(null)
const STORAGE_KEY = 'groovy-library-v1'

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const requestRef = useRef(0)
  const toastTimer = useRef(null)
  const [current, setCurrent] = useState(songs[1])
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(64)
  const [volume, setVolume] = useState(.65)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [queue, setQueue] = useState(songs)
  const [liked, setLiked] = useState(['nightfall', 'golden'])
  const [history, setHistory] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [localTracks, setLocalTracks] = useState([])
  const [toast, setToast] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const notify = useCallback(message => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved) {
        if (Array.isArray(saved.liked)) setLiked(saved.liked.filter(id => songs.some(song => song.id === id)))
        if (Array.isArray(saved.history)) setHistory(saved.history.filter(id => songs.some(song => song.id === id)))
        if (Array.isArray(saved.playlists)) setPlaylists(saved.playlists.filter(item => typeof item?.id === 'string' && typeof item?.name === 'string' && Array.isArray(item?.trackIds)))
        if (typeof saved.volume === 'number') setVolume(Math.min(1, Math.max(0, saved.volume)))
      }
    } catch { /* A fresh library also works when storage is unavailable. */ }
    setHydrated(true)
    return () => clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ liked, history, playlists, volume })) } catch { /* Storage is optional. */ }
  }, [liked, history, playlists, volume, hydrated])

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  const startAudio = useCallback(async () => {
    const request = ++requestRef.current
    setLoading(true)
    try {
      await audioRef.current.play()
    } catch (error) {
      if (request === requestRef.current && error.name !== 'AbortError') {
        setPlaying(false)
        notify('This track could not play. Try pressing play again.')
      }
    } finally { if (request === requestRef.current) setLoading(false) }
  }, [notify])

  const playTrack = useCallback((track, nextQueue) => {
    if (!track || !audioRef.current) return
    if (nextQueue?.length) setQueue(nextQueue)
    const audio = audioRef.current
    if (audio.dataset.track !== track.id) {
      audio.src = track.src
      audio.dataset.track = track.id
      setCurrent(track)
      setTime(0)
      setDuration(track.duration || 0)
    }
    setHistory(previous => [track.id, ...previous.filter(id => id !== track.id)].slice(0, 30))
    startAudio()
  }, [startAudio])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) playTrack(current)
    else { ++requestRef.current; audioRef.current.pause(); setLoading(false) }
  }, [current, playTrack])

  const next = useCallback((automatic = false) => {
    if (!queue.length) return
    const index = queue.findIndex(track => track.id === current.id)
    if (automatic && repeat === 'one') { audioRef.current.currentTime = 0; startAudio(); return }
    if (automatic && index === queue.length - 1 && repeat === 'off' && !shuffle) { setPlaying(false); return }
    let nextIndex = (index + 1) % queue.length
    if (shuffle && queue.length > 1) nextIndex = (Math.max(index, 0) + 1 + Math.floor(Math.random() * (queue.length - 1))) % queue.length
    playTrack(queue[nextIndex])
  }, [queue, current.id, repeat, shuffle, playTrack, startAudio])

  const previous = () => {
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; setTime(0); return }
    const index = queue.findIndex(track => track.id === current.id)
    if (queue.length) playTrack(queue[(index - 1 + queue.length) % queue.length])
  }
  const seek = value => { const target = Math.max(0, Math.min(Number(value), duration)); audioRef.current.currentTime = target; setTime(target) }
  const toggleLike = id => setLiked(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id])
  const addToQueue = track => {
    if (queue.some(item => item.id === track.id)) { notify('Already in your queue'); return }
    setQueue(previous => [...previous, track]); notify(`Added ${track.title} to your queue`)
  }
  const createPlaylist = name => {
    const playlist = { id: `my-${Date.now()}`, name: name.trim(), trackIds: [], image: '/images/nightfall.jpg', subtitle: 'Made by you' }
    setPlaylists(previous => [...previous, playlist]); notify('Your new playlist is ready'); return playlist
  }
  const addToPlaylist = (playlistId, track) => {
    setPlaylists(previous => previous.map(playlist => playlist.id === playlistId ? { ...playlist, image: track.image, trackIds: [...new Set([...playlist.trackIds, track.id])] } : playlist))
    notify('Added to your playlist')
  }
  const importFiles = files => {
    const imported = Array.from(files).filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)).map((file, i) => ({ id: `local-${Date.now()}-${i}`, title: file.name.replace(/\.[^.]+$/, ''), artist: 'Local audio', album: 'Your files', image: '/images/nightfall.jpg', src: URL.createObjectURL(file), duration: 0, genre: 'Local' }))
    setLocalTracks(previous => [...previous, ...imported]); notify(imported.length ? `${imported.length} audio file${imported.length === 1 ? '' : 's'} added for this session` : 'Choose a supported audio file')
  }

  useEffect(() => {
    const handleKey = event => {
      if (event.code === 'Space' && !event.repeat && !event.target.closest('button, a, input, textarea, select, [contenteditable], [role="dialog"]')) { event.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artist, album: current.album, artwork: [{ src: current.image, sizes: '700x700', type: 'image/jpeg' }] })
    navigator.mediaSession.setActionHandler('play', () => startAudio())
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current.pause())
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
    return () => ['play', 'pause', 'nexttrack'].forEach(action => navigator.mediaSession.setActionHandler(action, null))
  }, [current, next, startAudio])

  return <MusicContext.Provider value={{ current, playing, loading, time, duration, volume, setVolume, shuffle, setShuffle, repeat, setRepeat, queue, setQueue, liked, history, playlists, localTracks, toast, notify, playTrack, togglePlay, next, previous, seek, toggleLike, addToQueue, createPlaylist, addToPlaylist, importFiles }}>
    {children}
    <audio ref={audioRef} src={songs[1].src} data-track={songs[1].id} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onEnded={() => next(true)} onError={() => { setPlaying(false); setLoading(false); notify('Audio unavailable. Please try another track.') }} />
  </MusicContext.Provider>
}

export function useMusic() { return useContext(MusicContext) }
