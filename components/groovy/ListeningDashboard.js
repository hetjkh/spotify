import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bookmark, BookOpen, CheckCircle2, Clock, Headphones, History, Play, Settings2, Upload } from 'lucide-react'
import { api, fileUrl, toPlayerTracks } from '@/lib/api'
import { formatTime } from '@/data/groovy'
import { useAuth } from './AuthProvider'
import { useMusic } from './MusicProvider'
import { StudioMetric } from './ListeningStudio'

export default function ListeningDashboard() {
  const { user, ready, refresh } = useAuth()
  const music = useMusic()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)
  useEffect(() => {
    if (!user) return
    let active = true
    const load = () => api('/me/listening-dashboard?timeZone=' + encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)).then(next => { if (active) { setData(next); setError(''); setSettings(previous => previous || next.user) } }).catch(err => { if (active) setError(err.message) })
    load()
    const timer = setInterval(load, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [user])
  const action = async fn => { try { await fn() } catch (err) { setError(err.message) } }
  if (!ready) return <p>Loading your dashboard...</p>
  if (!user) return <div className="dashboard-studio"><header className="channel-stage"><div className="page-intro"><span className="eyebrow">YOUR DAY</span><h1>Your listening space</h1><p>Sign in to see what you were listening to.</p><Link className="button studio-button" href="/login">Sign in</Link></div></header></div>
  const play = entry => { const tracks = toPlayerTracks(entry.book); const track = tracks.find(item => item.id === entry.chapterId) || tracks[0]; if (track) music.playTrack(track, tracks, entry.seconds || 0) }
  const goal = settings?.weeklyGoal ?? 120
  const goalPercent = goal ? Math.min(100, Math.round((data?.summary.weekMinutes || 0) / goal * 100)) : 0
  const lead = data?.continueListening[0]
  const first = user.name.split(' ')[0]
  return <div className="listening-dashboard dashboard-studio dash-page">
    <header className="channel-stage studio-hero">
      {lead?.book.coverUrl && <div className="browse-resume-glow" aria-hidden="true" style={{ backgroundImage: `url(${fileUrl(lead.book.coverUrl)})` }} />}
      <div className="page-intro">
        <span className="eyebrow">YOUR DAY</span>
        <h1>Hello, {first}.</h1>
        <p>{lead ? `You left off in ${lead.book.title}.` : 'Nothing in progress. Find a story when you are ready.'}</p>
        {lead ? <button className="button studio-button" onClick={() => play(lead)}><Play size={15} fill="currentColor" />Continue my story</button> : <Link className="button studio-button" href="/browse">Find my next story<ArrowRight size={15} /></Link>}
      </div>
    </header>
    {user.isDemo && <p className="studio-demo-note">Demo account · sample listening activity</p>}
    {error && <p role="alert" className="form-alert">{error}</p>}
    {!data ? <p>Gathering your stories...</p> : <>
      <div className="studio-metrics dash-stats" aria-label="Listening summary">
        <StudioMetric value={Math.round(data.summary.todayMinutes)} label="Minutes today" icon={Headphones} />
        <StudioMetric value={Math.round(data.summary.weekMinutes)} label="Minutes this week" icon={Clock} />
        <StudioMetric value={data.summary.started} label="Books started" icon={BookOpen} />
        <StudioMetric value={data.summary.completed} label="Books completed" icon={CheckCircle2} />
      </div>
      <div className="dash-layout">
      <div className="dash-primary">
      <section className="dash-block" id="continue-listening">
        <div className="dash-block-head"><h2>Continue</h2><Link href="/library?status=in_progress">Open library</Link></div>
        {data.continueListening.length ? <div className="dash-resume">{data.continueListening.map(entry => {
          const chapter = entry.book.chapters.find(item => String(item._id) === entry.chapterId)
          const duration = chapter?.duration || entry.duration || 0
          const percent = duration ? Math.min(100, Math.round(entry.seconds / duration * 100)) : 0
          return <article className="studio-resume-card" key={entry.book.id}>
            <Link className="studio-resume-cover" href={`/listen/${entry.book.id}`}><img src={fileUrl(entry.book.coverUrl)} alt="" /></Link>
            <div className="studio-resume-copy">
              <Link href={`/listen/${entry.book.id}`}><h3>{entry.book.title}</h3></Link>
              <p>{chapter?.title || 'Current chapter'}</p>
              <progress aria-label={`${entry.book.title} chapter progress`} max={100} value={percent} />
              <button className="button studio-button" onClick={() => play(entry)}><Play size={14} fill="currentColor" />Resume</button>
            </div>
          </article>
        })}</div> : <p className="muted">Press play on a book and it will wait for you here. <Link href="/browse">Browse books</Link></p>}
      </section>
      <section className="dash-block" id="try-next">
        <div className="dash-block-head"><h2>Try next</h2><Link href="/browse">Browse</Link></div>
        {data.recommendations.length ? <div className="channel-shelf">{data.recommendations.slice(0, 4).map(book => <article className="channel-cover" key={book.id}><Link className="channel-cover-art" href={`/listen/${book.id}`}><img src={fileUrl(book.coverUrl)} alt="" /></Link><div className="channel-cover-copy"><Link href={`/listen/${book.id}`}><h3>{book.title}</h3></Link><p>{book.authorName}</p></div></article>)}</div> : <p className="muted">Save a book or pick a favorite genre and suggestions will show up here.</p>}
      </section>
      </div>
      <aside className="dash-rail">
      <section className="dash-block" id="this-week">
        <div className="dash-block-head"><h2>This week</h2></div>
        <div className="dash-goal">
          <div className="studio-goal-ring" role="progressbar" aria-label="Weekly listening goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPercent} style={{ '--goal-progress': `${goalPercent}%` }}><div><strong>{goalPercent}%</strong></div></div>
          <div>
            <p><strong>{Math.round(data.summary.weekMinutes)} minutes</strong> of {goal} this week</p>
            <span>{!goal ? 'Set a weekly goal in preferences.' : goalPercent >= 100 ? 'You reached this week’s goal.' : `${Math.max(0, Math.ceil(goal - data.summary.weekMinutes))} minutes left.`}</span>
          </div>
        </div>
      </section>
      <nav className="dash-jumps" aria-label="More">
        <Link href="/library"><BookOpen size={18} />Library</Link>
        <Link href="/bookmarks"><Bookmark size={18} />Bookmarks</Link>
        <Link href="/recent"><History size={18} />History</Link>
        <Link href="/download"><Headphones size={18} />Downloads</Link>
        <Link href="/creator">Open creator workspace<Upload size={18} /></Link>
      </nav>
      <details className="dash-preferences" id="listening-preferences">
        <summary><Settings2 size={18} />Listening preferences</summary>
        {settings && <form onSubmit={event => { event.preventDefault(); action(async () => { await api('/me/settings', { method: 'PATCH', body: JSON.stringify(settings) }); music.setPlaybackRate(Number(settings.playbackRate)); await refresh(); music.notify('Preferences saved') }) }}>
          <label className="field-label">Weekly listening goal (minutes)<input className="text-field" type="number" min="0" max="10080" value={settings.weeklyGoal ?? 120} onChange={event => setSettings({ ...settings, weeklyGoal: Number(event.target.value) })} /></label>
          <label className="field-label">Monthly book goal<input className="text-field" type="number" min="0" max="100" value={settings.monthlyGoal ?? 2} onChange={event => setSettings({ ...settings, monthlyGoal: Number(event.target.value) })} /></label>
          <p className="muted">{data.summary.monthlyCompleted} books completed this month</p>
          <label className="field-label">Default playback speed<select className="text-field" value={settings.playbackRate} onChange={event => setSettings({ ...settings, playbackRate: Number(event.target.value) })}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}x</option>)}</select></label>
          <label className="field-label">Default sleep timer<select className="text-field" value={settings.sleepMinutes || 0} onChange={event => setSettings({ ...settings, sleepMinutes: Number(event.target.value) })}>{[0, 15, 30, 45, 60].map(minutes => <option key={minutes} value={minutes}>{minutes ? `${minutes} minutes` : 'Off'}</option>)}</select></label>
          <button className="button studio-button" type="submit">Save preferences</button>
        </form>}
      </details>
      </aside>
      </div>
    </>}
  </div>
}
