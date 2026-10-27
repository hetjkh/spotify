import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { PLACEHOLDER_COVER } from '@/data/groovy'
import { api, toPlayerTracks } from '@/lib/api'
import { useAuth } from './AuthProvider'
import { downloadedBook, offlineBook, downloadBook } from '@/lib/offline'
import { IDLE_TRACK } from '@/lib/player'

const MusicContext = createContext(null)
const STORAGE_KEY = 'groovy-library-v4'

export function MusicProvider({ children }) {
  const { user, ready } = useAuth()
  const storageKey = `${STORAGE_KEY}:${user?.id || 'guest'}`
  const pendingSync = useRef(false)
  const pendingSeek = useRef(null)
  const lastSave = useRef(0)
  const lastListenTick = useRef(0)
  const listened = useRef(0)
  const [registryVersion, setRegistryVersion] = useState(0)
  const audioRef = useRef(null)
  const requestRef = useRef(0)
  const toastTimer = useRef(null)
  const sleepRef = useRef(null)
  const progressRef = useRef({})
  const trackRegistry = useRef({})
  const [current, setCurrent] = useState(IDLE_TRACK)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(.65)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [queue, setQueue] = useState([])
  const [liked, setLiked] = useState([])
  const [history, setHistory] = useState([])
  const [progress, setProgress] = useState({})
  const [playlists, setPlaylists] = useState([])
  const [localTracks, setLocalTracks] = useState([])
  const [toast, setToast] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [sleepUntil, setSleepUntil] = useState(null)
  const [sleepMode, setSleepMode] = useState(null)
  const sleepModeRef = useRef(null)

  const notify = useCallback(message => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }, [])

  const rememberTrack = track => { if (track?.id) trackRegistry.current[track.id] = track }

  const getTracksByIds = useCallback(ids => ids.map(id => trackRegistry.current[id] || localTracks.find(item => item.id === id)).filter(Boolean), [localTracks, registryVersion])

  useEffect(() => {
    if (!ready) return
    let active = true
    pendingSync.current = false
    let localSnapshot = null
    setHydrated(false)
    audioRef.current?.pause()
    audioRef.current?.removeAttribute('src')
    if (audioRef.current) delete audioRef.current.dataset.track
    pendingSeek.current = null
    clearTimeout(sleepRef.current); sleepModeRef.current = null; setSleepMode(null); setSleepUntil(null)
    setTime(0); setDuration(0); lastListenTick.current = 0; listened.current = 0
    setCurrent(IDLE_TRACK); setQueue([]); setLiked([]); setHistory([]); setPlaylists([]); setProgress({}); setLocalTracks([]); setVolume(.65); setPlaybackRate(user?.playbackRate || 1)
    progressRef.current = {}; trackRegistry.current = {}
    const restore = saved => {
      if (!saved || !active) return
      setLiked(saved.liked || []); setHistory(saved.history || []); setPlaylists((saved.playlists || []).map(item => ({ ...item, image: item.image || saved.tracks?.[item.trackIds?.[0]]?.image || PLACEHOLDER_COVER, subtitle: item.subtitle || 'Made by you' })))
      if (saved.tracks) trackRegistry.current = saved.tracks
      if (saved.progress) { progressRef.current = saved.progress; setProgress(saved.progress) }
      if (typeof saved.volume === 'number') setVolume(saved.volume)
      if (typeof saved.playbackRate === 'number') setPlaybackRate(saved.playbackRate)
      setRegistryVersion(value => value + 1)
    }
    try { localSnapshot = JSON.parse(localStorage.getItem(storageKey) || 'null'); pendingSync.current = Boolean(localSnapshot?.unsynced); restore(localSnapshot) } catch {}
    const load = async () => {
      if (user) {
        try {
          const data = await api('/me/player-state')
          if (!active) return
          const tracks = { ...trackRegistry.current }
          data.books.forEach(book => toPlayerTracks(book).forEach(track => { tracks[track.id] = track }))
          if (!pendingSync.current) restore({ ...data.state, tracks })
          else { trackRegistry.current = tracks; setRegistryVersion(value => value + 1) }
          setPlaybackRate(user.playbackRate || 1)
        } catch { /* Keep the account's local copy when offline. */ }
      }
      if (active) setHydrated(true)
    }
    load()
    return () => { active = false; clearTimeout(toastTimer.current) }
  }, [ready, user?.id, storageKey])

  useEffect(() => {
    if (!hydrated) return
    const state = { unsynced: pendingSync.current, liked, history, playlists, volume, playbackRate, progress, tracks: Object.fromEntries(Object.entries(trackRegistry.current).filter(([, track]) => !track.src.startsWith('blob:'))) }
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch {}
  }, [liked, history, playlists, volume, playbackRate, progress, hydrated, storageKey, registryVersion])
  useEffect(() => {
    if (!hydrated || !user) return
    const timer = setTimeout(() => api('/me/player-state', { method: 'PUT', body: JSON.stringify({ liked, history, playlists }) }).then(() => {
      try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (saved && JSON.stringify([saved.liked, saved.history, saved.playlists]) === JSON.stringify([liked, history, playlists])) { pendingSync.current = false; saved.unsynced = false; localStorage.setItem(storageKey, JSON.stringify(saved)) } } catch {}
    }).catch(() => {}), 500)
    return () => clearTimeout(timer)
  }, [liked, history, playlists, hydrated, user?.id])
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}) }, [])

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate }, [playbackRate])
  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => api('/me/settings', { method: 'PATCH', body: JSON.stringify({ playbackRate }) }).catch(() => {}), 800)
    return () => clearTimeout(timer)
  }, [playbackRate, hydrated])

  const startAudio = useCallback(async () => {
    if (!audioRef.current?.getAttribute('src')) { notify('Choose a book first'); return }
    const request = ++requestRef.current
    setLoading(true)
    try {
      await audioRef.current.play()
    } catch (error) {
      if (request === requestRef.current && error.name !== 'AbortError') {
        setPlaying(false)
        notify('This chapter could not play. Try pressing play again.')
      }
    } finally { if (request === requestRef.current) setLoading(false) }
  }, [notify])

  const saveProgress = useCallback((id, seconds) => {
    progressRef.current = { ...progressRef.current, [id]: seconds }
    setProgress(progressRef.current)
  }, [])

  const playTrack = useCallback((track, nextQueue, startSeconds) => {
    if (!track?.src || !audioRef.current) { notify('No audio for this chapter'); return }
    pendingSync.current = true
    rememberTrack(track)
    if (nextQueue?.length) setQueue(nextQueue)
    const audio = audioRef.current
    if (audio.dataset.track !== track.id || !audio.getAttribute('src') || audio.getAttribute('src') !== track.src) {
      audio.src = track.src
      audio.dataset.track = track.id
      setCurrent(track)
      const startAt = Math.max(0, startSeconds != null ? Number(startSeconds) || 0 : Number(progressRef.current[track.id]) || 0)
      pendingSeek.current = startAt
      audio.currentTime = startAt
      setTime(startAt)
      setDuration(track.duration || 0)
    }
    if (startSeconds != null) { pendingSeek.current = Math.max(0, Number(startSeconds) || 0); audio.currentTime = pendingSeek.current; setTime(pendingSeek.current); saveProgress(track.id, pendingSeek.current) }
    setRegistryVersion(value => value + 1)
    if (audio.paused && user?.sleepMinutes && !sleepModeRef.current) setSleep(user.sleepMinutes)
    setHistory(previous => [track.id, ...previous.filter(id => id !== track.id)].slice(0, 30))
    startAudio()
  }, [startAudio, notify, user?.sleepMinutes, saveProgress])

  const playBook = useCallback(async bookId => {
    try {
      const cached = downloadedBook(user?.id, bookId)
      const data = cached ? { book: offlineBook(cached, user?.id) } : await api(`/books/${bookId}`)
      const tracks = toPlayerTracks(data.book)
      tracks.forEach(rememberTrack)
      if (!tracks.length) return
      const resume = data.book.progress
      const index = resume?.chapterId ? Math.max(0, tracks.findIndex(item => item.id === String(resume.chapterId))) : 0
      playTrack(tracks[index], tracks, resume?.seconds)
      api(`/books/${bookId}/play`, { method: 'POST', body: JSON.stringify({}) }).catch(() => {})
    } catch (error) {
      notify(error.message || 'Could not load this book')
    }
  }, [playTrack, notify, user?.id])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !current.src) { notify('Open a book and press play'); return }
    if (audioRef.current.paused) startAudio()
    else { ++requestRef.current; audioRef.current.pause(); setLoading(false) }
  }, [current.src, startAudio, notify])

  const next = useCallback((automatic = false) => {
    if (!queue.length) return
    const index = queue.findIndex(track => track.id === current.id)
    if (automatic && repeat === 'one') { audioRef.current.currentTime = 0; startAudio(); return }
    if (automatic && index === queue.length - 1 && repeat === 'off' && !shuffle) { setPlaying(false); return }
    let nextIndex = (index + 1) % queue.length
    if (shuffle && queue.length > 1) nextIndex = (Math.max(index, 0) + 1 + Math.floor(Math.random() * (queue.length - 1))) % queue.length
    playTrack(queue[nextIndex], undefined, automatic ? 0 : undefined)
  }, [queue, current.id, repeat, shuffle, playTrack, startAudio])

  const previous = () => {
    if (!audioRef.current) return
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; setTime(0); return }
    const index = queue.findIndex(track => track.id === current.id)
    if (queue.length) playTrack(queue[(index - 1 + queue.length) % queue.length])
  }
  const skipBy = seconds => {
    const target = Math.max(0, Math.min((audioRef.current?.currentTime || 0) + seconds, duration || 3600))
    audioRef.current.currentTime = target
    setTime(target)
    saveProgress(current.id, target)
  }
  const seek = value => { const target = Math.max(0, Math.min(Number(value), duration || 3600)); audioRef.current.currentTime = target; setTime(target); saveProgress(current.id, target) }
  const toggleLike = id => { pendingSync.current = true; setLiked(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]) }
  const toggleTrackLike = track => { rememberTrack(track); toggleLike(track.id) }
  const addToQueue = track => {
    rememberTrack(track)
    if (queue.some(item => item.id === track.id)) { notify('Already in your chapter list'); return }
    setQueue(previous => [...previous, track]); notify(`Added ${track.title} to chapters`)
  }
  const createPlaylist = name => {
    pendingSync.current = true
    const playlist = { id: `my-${Date.now()}`, name: name.trim(), trackIds: [], image: PLACEHOLDER_COVER, subtitle: 'Made by you' }
    setPlaylists(previous => [...previous, playlist]); notify('Your listening list is ready'); return playlist
  }
  const addToPlaylist = (playlistId, track) => {
    pendingSync.current = true
    rememberTrack(track)
    setPlaylists(previous => previous.map(playlist => playlist.id === playlistId ? { ...playlist, image: track.image, trackIds: [...new Set([...playlist.trackIds, track.id])] } : playlist))
    notify('Added to your listening list')
  }
  const updatePlaylist = (id, changes) => {
    pendingSync.current = true
    setPlaylists(previous => previous.map(item => item.id === id ? { ...item, ...(changes.name?.trim() && { name: changes.name.trim().slice(0, 80) }), ...(Array.isArray(changes.trackIds) && { trackIds: [...new Set(changes.trackIds)] }) } : item))
    notify('Listening list updated')
  }
  const deletePlaylist = id => {
    pendingSync.current = true
    setPlaylists(previous => previous.filter(item => item.id !== id))
    notify('Listening list deleted')
  }
  const removeFromHistory = id => { pendingSync.current = true; setHistory(previous => previous.filter(item => item !== id)); notify('Chapter removed from history') }
  const removeLocalTrack = id => {
    const track = localTracks.find(item => item.id === id)
    if (current.id === id) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); setCurrent(IDLE_TRACK); setTime(0); setDuration(0) }
    setLocalTracks(previous => previous.filter(item => item.id !== id)); setQueue(previous => previous.filter(item => item.id !== id))
    pendingSync.current = true
    setLiked(previous => previous.filter(item => item !== id)); setHistory(previous => previous.filter(item => item !== id))
    setPlaylists(previous => previous.map(item => ({...item, trackIds:item.trackIds.filter(trackId => trackId !== id)})))
    delete trackRegistry.current[id]; setRegistryVersion(value => value + 1)
    if (track?.src?.startsWith('blob:')) URL.revokeObjectURL(track.src)
    notify('Local file removed from this session')
  }
  const importFiles = files => {
    const imported = Array.from(files).filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|m4b|flac|aac)$/i.test(file.name)).map((file,i) => ({ id: `local-${Date.now()}-${i}`, title:file.name.replace(/\.[^.]+$/,''), originalName:file.name, artist:'Local audio', album:'Your files', image:PLACEHOLDER_COVER, src:URL.createObjectURL(file), duration:0, bytes:file.size, format:(file.name.split('.').pop() || 'audio').toUpperCase(), importedAt:Date.now(), metadataStatus:'loading', genre:'Local' }))
    imported.forEach(track => {
      rememberTrack(track)
      const probe = new Audio()
      let timer
      let done = false
      const finish = duration => {
        if (done) return
        done = true; clearTimeout(timer)
        probe.onloadedmetadata = null; probe.onerror = null
        probe.removeAttribute('src'); probe.load()
        if (trackRegistry.current[track.id]?.src !== track.src) return
        const updated = {...track,duration:Number.isFinite(duration) ? duration : 0,metadataStatus:Number.isFinite(duration) && duration > 0 ? 'ready' : 'unavailable'}
        rememberTrack(updated)
        setLocalTracks(previous => previous.map(item => item.id === track.id ? updated : item))
        setRegistryVersion(value => value + 1)
      }
      probe.preload = 'metadata'
      probe.onloadedmetadata = () => finish(probe.duration)
      probe.onerror = () => finish(0)
      timer = setTimeout(() => finish(0),15000)
      probe.src = track.src
    })
    setLocalTracks(previous => [...previous,...imported])
    notify(imported.length ? `${imported.length} audio file${imported.length === 1 ? '' : 's'} added for this session` : 'Choose a supported audio file')
    return imported
  }

  const setSleep = (minutes, mode = 'minutes') => {
    clearTimeout(sleepRef.current)
    sleepModeRef.current = minutes || mode === 'chapter' ? mode : null
    setSleepMode(sleepModeRef.current)
    if (!minutes && mode !== 'chapter') { setSleepUntil(null); sleepModeRef.current = null; setSleepMode(null); notify('Sleep timer off'); return }
    if (mode === 'chapter') {
      setSleepUntil(Date.now() + 24 * 60 * 60000)
      notify('Sleep timer · end of chapter')
      return
    }
    const until = Date.now() + minutes * 60000
    setSleepUntil(until)
    sleepRef.current = setTimeout(() => {
      ++requestRef.current
      audioRef.current?.pause()
      setSleepUntil(null)
      setSleepMode(null)
      sleepModeRef.current = null
      notify('Sleep timer ended')
    }, minutes * 60000)
    notify(`Sleep timer · ${minutes} min`)
  }

  const bookmarkHere = (note = '') => {
    if (!current?.bookId || String(current.bookId).length < 20) { notify('Bookmarks work on catalog books'); return }
    api('/bookmarks', { method: 'POST', body: JSON.stringify({ bookId: current.bookId, chapterId: current.id, chapterTitle: current.title, seconds: Math.floor(time), note }) })
      .then(() => { window.dispatchEvent(new Event('groovy:bookmarks')); notify(`Bookmark saved · ${current.title}`) })
      .catch(error => notify(error.message))
  }

  const downloadCurrent = async () => {
    if (!current.bookId) return
    try { const data = await api('/books/' + current.bookId); await downloadBook(data.book, user?.id, percent => notify('Downloading ' + percent + '%')); notify('Book ready offline') } catch (error) { notify(error.message) }
  }

  useEffect(() => {
    if (!playing || !current?.bookId || String(current.bookId).length < 20) return
    let guestId = ''
    try { guestId = localStorage.getItem('groovy-guest') || `g-${Date.now()}`; localStorage.setItem('groovy-guest', guestId) } catch {}
    const beat = () => api(`/books/${current.bookId}/presence`, { method: 'POST', body: JSON.stringify({ guestId }) }).catch(() => {})
    beat()
    const timer = setInterval(beat, 15000)
    return () => clearInterval(timer)
  }, [playing, current.bookId])

  useEffect(() => {
    const handleKey = event => {
      if (event.code === 'Space' && !event.repeat && !event.target.closest('button, a, input, textarea, select, [contenteditable], [role="dialog"]')) { event.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !window.MediaMetadata || current.id === 'idle') return
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artist, album: current.album, artwork: [{ src: current.image, sizes: '700x700', type: 'image/jpeg' }] })
    navigator.mediaSession.setActionHandler('play', () => startAudio())
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current.pause())
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
    navigator.mediaSession.setActionHandler('seekbackward', () => skipBy(-15))
    navigator.mediaSession.setActionHandler('seekforward', () => skipBy(15))
    return () => ['play', 'pause', 'nexttrack', 'seekbackward', 'seekforward'].forEach(action => navigator.mediaSession.setActionHandler(action, null))
  }, [current, next, startAudio])

  function persistProgress() {
    const audio = audioRef.current
    if (!user || !current.bookId || !audio || !Number.isFinite(audio.duration)) return
    lastSave.current = Date.now()
    const delta = listened.current; listened.current = 0
    const index = queue.findIndex(track => track.id === current.id)
    const finished = audio.ended && queue[index + 1]?.bookId !== current.bookId
    api('/me/progress', { method: 'POST', body: JSON.stringify({ bookId: current.bookId, chapterId: current.id, seconds: audio.currentTime, duration: audio.duration, finished, listenedSeconds: delta, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }).catch(() => {})
  }
  return <MusicContext.Provider value={{ hydrated, current, playing, loading, time, duration, volume, setVolume, playbackRate, setPlaybackRate, shuffle, setShuffle, repeat, setRepeat, queue, setQueue, liked, history, progress, playlists, localTracks, toast, notify, playTrack, playBook, togglePlay, next, previous, skipBy, seek, toggleLike, toggleTrackLike, addToQueue, createPlaylist, addToPlaylist, updatePlaylist, deletePlaylist, removeFromHistory, removeLocalTrack, importFiles, sleepUntil, sleepMode, setSleep, bookmarkHere, downloadCurrent, getTracksByIds }}>
    {children}
    <audio ref={audioRef} preload="metadata" onPlay={() => { lastListenTick.current = Date.now(); setPlaying(true) }} onPause={() => { setPlaying(false); persistProgress() }} onTimeUpdate={event => {
      const seconds = event.currentTarget.currentTime
      setTime(seconds)
      if (current.id !== 'idle') saveProgress(current.id, seconds)
      const now = Date.now()
      if (!event.currentTarget.paused && lastListenTick.current) listened.current += Math.min(2, (now - lastListenTick.current) / 1000)
      lastListenTick.current = now
      if (now - lastSave.current >= 8000) persistProgress()
    }} onLoadedMetadata={event => { setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0); event.currentTarget.playbackRate = playbackRate; if (pendingSeek.current != null) { event.currentTarget.currentTime = Math.min(pendingSeek.current, Math.max(0, event.currentTarget.duration - 0.1)); pendingSeek.current = null } }} onEnded={() => {
      if (sleepModeRef.current === 'chapter') {
        ++requestRef.current
        audioRef.current?.pause()
        setSleepUntil(null)
        setSleepMode(null)
        sleepModeRef.current = null
        notify('Sleep timer ended at chapter close')
        return
      }
      if (current.bookId && String(current.bookId).length >= 20) {
        const last = queue[queue.length - 1]
        api('/me/progress', { method: 'POST', body: JSON.stringify({ bookId: current.bookId, chapterId: current.id, seconds: duration, duration, finished: last?.id === current.id }) }).catch(() => {})
      }
      next(true)
    }} onError={() => { setPlaying(false); setLoading(false); notify('Audio unavailable. Please try another chapter.') }} />
  </MusicContext.Provider>
}

export function useMusic() { return useContext(MusicContext) }
