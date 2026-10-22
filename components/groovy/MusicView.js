import { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, AudioLines, Check, ChevronLeft, ChevronRight, Coffee, Disc3, Heart, Headphones, ListMusic, Moon, Music2, Pause, Play, Plus, Radio, Search, Sparkles, Sun, Upload } from 'lucide-react'
import { artists, genres, mixes, sessions, songs, tracksFor } from '@/data/groovy'
import { useMusic } from './MusicProvider'
import { ArtistCard, IconButton, MixCard, Modal, SectionHeading, TrackList } from './UI'

const genreIcons = { wave: AudioLines, sparkles: Sparkles, sun: Sun, coffee: Coffee, moon: Moon }
const features = [
  { tag: 'TRENDING THIS WEEK', title: <>In my<br />feelings.</>, artist: 'Luna Grey', description: 'Some songs just get you. Find your moment.', image: '/images/luna.jpg', song: songs[0], number: '01' },
  { tag: 'THE AFTER HOURS EDIT', title: <>Meet me<br />at midnight.</>, artist: 'Atlas', description: 'A little less noise. A little more night.', image: '/images/atlas.jpg', song: songs[1], number: '02' },
  { tag: 'A FRESH PERSPECTIVE', title: <>Let the<br />light in.</>, artist: 'Nova', description: 'A new day deserves a new soundtrack.', image: '/images/nova.jpg', song: songs[2], number: '03' },
]

function Hero() {
  const [index, setIndex] = useState(0)
  const music = useMusic()
  const feature = features[index]
  const active = music.current.id === feature.song.id && music.playing
  return <section className="hero" aria-label="Featured music"><motion.img key={feature.image} className="hero-portrait" src={feature.image} alt={`${feature.artist}, featured artist`} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }} fetchPriority="high" /><div className="hero-overlay" /><span className="hero-watermark">FEEL IT ALL.</span><motion.div key={feature.artist} className="hero-copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}><span className="hero-tag"><span />{feature.tag}</span><h1>{feature.title}</h1><div className="hero-artist"><span>{feature.artist}</span><span className="verified"><Check size={9} strokeWidth={3} /></span><span className="hero-artist-detail">The Midnight Sessions</span></div><p>{feature.description}</p><div className="hero-actions"><button className="button button-primary" onClick={() => active ? music.togglePlay() : music.playTrack(feature.song, songs)}>{active ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{active ? 'Pause' : 'Listen now'}</button><IconButton label={music.liked.includes(feature.song.id) ? 'Remove featured track from favorites' : 'Save featured track'} aria-pressed={music.liked.includes(feature.song.id)} className={`hero-like ${music.liked.includes(feature.song.id) ? 'is-liked' : ''}`} onClick={() => music.toggleLike(feature.song.id)}><Heart size={18} fill={music.liked.includes(feature.song.id) ? 'currentColor' : 'none'} /></IconButton></div></motion.div><button className="hero-fab" aria-label={active ? `Pause ${feature.song.title}` : `Play ${feature.song.title}`} onClick={() => active ? music.togglePlay() : music.playTrack(feature.song, songs)}>{active ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button><div className="hero-pagination"><div className="hero-dots">{features.map((item, i) => <button key={item.number} className={index === i ? 'active' : ''} aria-label={`Show featured artist ${item.artist}`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div><span>{feature.number}<span> / 03</span></span><div className="hero-arrows"><IconButton label="Previous featured artist" onClick={() => setIndex((index + 2) % 3)}><ChevronLeft size={17} /></IconButton><IconButton label="Next featured artist" onClick={() => setIndex((index + 1) % 3)}><ChevronRight size={17} /></IconButton></div></div></section>
}

function GenreTiles({ full = false }) {
  return <div className={`genre-grid ${full ? 'full-genres' : ''}`}>{genres.slice(0, full ? 5 : 4).map(genre => { const Icon = genreIcons[genre.icon]; return <Link key={genre.name} href={`/genres?genre=${encodeURIComponent(genre.name)}`} className="genre-tile" style={{ '--genre-color': genre.color }}><span><strong>{genre.name}</strong>{full && <small>{genre.caption}</small>}</span><Icon size={full ? 44 : 34} strokeWidth={1} /><ArrowUpRight className="genre-arrow" size={15} /></Link> })}</div>
}

function HomeView() {
  return <div className="discovery-page"><div className="greeting"><div><span className="eyebrow">YOUR EVERYDAY ESCAPE</span><h2>Good music. Better days<span>.</span></h2></div><span className="greeting-note"><Headphones size={15} />Tune into yourself</span></div><Hero /><section className="artists-section"><SectionHeading title="Artists you’ll love" href="/artists" /><div className="artists-row">{artists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</div></section><div className="discovery-columns"><section className="genres-section"><SectionHeading title="Find your mood" href="/genres" /><GenreTiles /></section><section className="charts-section"><SectionHeading title="On repeat" href="/charts" /><TrackList tracks={[songs[1], songs[0], songs[2], songs[3]]} /></section></div><section className="made-for-you"><SectionHeading title="Made for your kind of day" eyebrow="A SOUNDTRACK FOR EVERY MOMENT" href="/collection/playlists" /><div className="mix-grid">{mixes.map((mix, index) => <MixCard key={mix.id} mix={mix} index={index} />)}</div></section><div className="page-footnote"><AudioLines size={16} /><span>A world of sound. A space that&apos;s yours.</span><span>Made for listening.</span></div></div>
}

function PageIntro({ eyebrow, title, description, children }) { return <div className="page-intro"><span className="eyebrow">{eyebrow || 'MAKE YOURSELF AT HOME'}</span><div><h1>{title}</h1>{children}</div>{description && <p>{description}</p>}</div> }

function LibraryTabs() {
  const router = useRouter()
  return <nav className="filter-tabs" aria-label="Library categories">{[{ name: 'Playlists', href: '/collection/playlists' }, { name: 'Favorites', href: '/collection/tracks' }, { name: 'Albums', href: '/collection/albums' }, { name: 'Artists', href: '/collection/artists' }, { name: 'Sessions', href: '/collection/podcasts' }].map(tab => <Link key={tab.href} href={tab.href} className={router.asPath === tab.href ? 'selected' : ''}>{tab.name}</Link>)}</nav>
}

function PlaylistView({ id }) {
  const music = useMusic()
  const router = useRouter()
  const isFavorites = id === 'favorites'
  const oldIndex = /^playlist-\d+$/.test(id || '') ? Number(id.split('-')[1]) % mixes.length : -1
  const playlist = isFavorites ? { name: 'Favorites', subtitle: 'The ones you come back to. All in one place.', trackIds: music.liked, image: '/images/bloom.jpg' } : [...mixes, ...music.playlists, ...sessions].find(item => item.id === id) || (oldIndex >= 0 ? mixes[oldIndex] : null)
  if (!playlist) return <><PageIntro title="This playlist is off the record." description="It may have been removed, or it lives in a different browser." /><Link className="button button-primary" href="/collection/playlists">Back to your library</Link></>
  const tracks = tracksFor(playlist.trackIds)
  const isCustom = music.playlists.some(item => item.id === id)
  return <><button className="back-link" onClick={() => router.push('/collection/playlists')}><ArrowLeft size={16} />Your library</button><div className={`collection-hero ${isFavorites ? 'favorites-hero' : ''}`}><div className="collection-cover">{isFavorites ? <Heart size={72} fill="currentColor" strokeWidth={1} /> : <img src={playlist.image} alt={`${playlist.name} artwork`} />}</div><div><span className="eyebrow">{isFavorites ? 'YOUR FAVORITES' : isCustom ? 'YOUR OWN MIX' : 'THE GROOVY COLLECTION'}</span><h1>{playlist.name}</h1><p>{playlist.subtitle}</p><span className="collection-meta">{isCustom || isFavorites ? 'Jamie Parker' : 'Curated by Groovy'}<span>·</span>{tracks.length} tracks<span>·</span>{Math.floor(tracks.reduce((total, track) => total + track.duration, 0) / 60)} min</span></div></div><div className="collection-controls"><button className="button button-primary" disabled={!tracks.length} onClick={() => music.playTrack(tracks[0], tracks)}><Play size={17} fill="currentColor" />Play all</button><button className="button button-quiet" disabled={!tracks.length} onClick={() => { music.setShuffle(true); music.playTrack(tracks[Math.floor(Math.random() * tracks.length)], tracks) }}><AudioLines size={17} />Shuffle</button><span>Original instrumental demos</span></div><TrackList tracks={tracks} showAlbum empty={isCustom ? 'A fresh start for your next obsession.' : 'Save the songs that feel like you.'} />{isCustom && <section className="playlist-suggestions"><SectionHeading title="A few to get you started" /><p className="muted">Add something you love to {playlist.name}.</p>{songs.filter(song => !playlist.trackIds.includes(song.id)).map(song => <div className="suggested-track" key={song.id}><img src={song.image} alt="" /><div><strong>{song.title}</strong><small>{song.artist}</small></div><button className="button button-quiet" onClick={() => music.addToPlaylist(id, song)}><Plus size={15} />Add</button></div>)}</section>}</>
}

function ArtistsView() {
  const router = useRouter()
  const selected = artists.find(artist => artist.id === router.query.artist)
  const music = useMusic()
  if (selected) { const tracks = songs.filter(song => song.artistId === selected.id); return <><Link href="/artists" className="back-link"><ArrowLeft size={16} />All artists</Link><div className="collection-hero artist-detail"><img className="artist-detail-portrait" src={selected.image} alt={selected.name} /><div><span className="eyebrow"><Check size={13} /> FEATURED DEMO ARTIST</span><h1>{selected.name}</h1><p>{selected.genre} for your everyday escape.</p><button className="button button-primary" onClick={() => music.playTrack(tracks[0], tracks)}><Play size={16} fill="currentColor" />Listen now</button></div></div><SectionHeading title="Popular tracks" /><TrackList tracks={tracks} showAlbum /><section className="related-artists"><SectionHeading title="Keep discovering" /><div className="artists-row">{artists.filter(artist => artist.id !== selected.id).map(artist => <ArtistCard artist={artist} key={artist.id} />)}</div></section></> }
  return <><PageIntro eyebrow="THE PEOPLE BEHIND THE FEELING" title="Your next favorite artist." description="Fresh voices. Familiar feelings. Find your connection." /><div className="artists-full-grid">{artists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</div></>
}

function SearchView() {
  const router = useRouter()
  const query = router.query.searchQuery || ''
  const [value, setValue] = useState(query)
  const [filter, setFilter] = useState(router.pathname.split('/').pop() === '[searchQuery]' ? 'all' : router.pathname.split('/').pop())
  const normalized = String(query).toLowerCase()
  const trackResults = songs.filter(song => `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase().includes(normalized))
  const artistResults = artists.filter(artist => `${artist.name} ${artist.genre}`.toLowerCase().includes(normalized))
  const mixResults = mixes.filter(mix => `${mix.name} ${mix.subtitle}`.toLowerCase().includes(normalized))
  const visibleFilter = ['tracks', 'artists', 'playlists'].includes(filter) ? filter : 'all'
  return <><PageIntro eyebrow="FOLLOW YOUR CURIOSITY" title={query ? `Results for “${query}”` : 'What moves you?'} description={query ? 'A little closer to your next favorite.' : 'Find a song, an artist, or a whole new feeling.'} /><form className="page-search" onSubmit={event => { event.preventDefault(); if (value.trim()) router.push(`/search/${encodeURIComponent(value.trim())}`) }}><Search size={22} /><input aria-label="Find music" placeholder="Songs, artists, albums..." value={value} onChange={event => setValue(event.target.value)} /><button className="button button-primary" type="submit">Search</button></form>{!query ? <><SectionHeading title="Browse your mood" /><GenreTiles full /><section className="search-discover"><SectionHeading title="A good place to start" /><div className="mix-grid">{mixes.map(mix => <MixCard key={mix.id} mix={mix} />)}</div></section></> : <><div className="filter-tabs">{['all', 'tracks', 'artists', 'playlists'].map(item => <button key={item} className={visibleFilter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item === 'all' ? 'All results' : item[0].toUpperCase() + item.slice(1)}</button>)}</div>{(visibleFilter === 'all' || visibleFilter === 'tracks') && <section><SectionHeading title="Songs" /><TrackList tracks={trackResults} showAlbum empty="We couldn’t find that one." /></section>}{(visibleFilter === 'all' || visibleFilter === 'artists') && <section className="search-result-section"><SectionHeading title="Artists" />{artistResults.length ? <div className="artists-full-grid">{artistResults.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</div> : <p className="muted">No artists match this search.</p>}</section>}{(visibleFilter === 'all' || visibleFilter === 'playlists') && <section className="search-result-section"><SectionHeading title="Playlists" />{mixResults.length ? <div className="mix-grid">{mixResults.map(mix => <MixCard key={mix.id} mix={mix} />)}</div> : <p className="muted">No playlists match this search.</p>}</section>}</>}</>
}

function RadioView({ podcasts = false }) {
  const music = useMusic()
  return <><PageIntro eyebrow={podcasts ? 'PRESS PLAY. SETTLE IN.' : 'ALWAYS A GOOD FREQUENCY'} title={podcasts ? 'Stay a little longer.' : 'Find your frequency.'} description={podcasts ? 'Instrumental listening sessions for a little time to yourself.' : 'Continuous mixes, curated for whatever the day brings.'} /><section className={`radio-feature ${podcasts ? 'session-feature' : ''}`}><img src={podcasts ? '/images/atlas.jpg' : '/images/live.jpg'} alt="" /><div><span className="hero-tag"><span />{podcasts ? 'THE LISTENING ROOM' : 'GROOVY RADIO · DEMO STATION'}</span><h2>{podcasts ? 'Good sounds.\nBetter company.' : 'Your world.\nOn a different wavelength.'}</h2><p>{podcasts ? 'A music-only session with Atlas.' : 'Original music, flowing from one feeling to the next.'}</p><button className="button button-primary" onClick={() => { music.setRepeat('all'); music.playTrack(podcasts ? songs[1] : songs[4], songs) }}><Play size={16} fill="currentColor" />{podcasts ? 'Play session' : 'Tune in'}</button></div></section><SectionHeading title={podcasts ? 'The latest sessions' : 'Something for every mood'} /><div className="session-grid">{sessions.map((session, index) => <article className="session-card" key={session.id}><Link href={`/playlist/${session.id}`}><img src={session.image} alt="" /><span className="session-number">0{index + 1}</span></Link><div><h3>{session.name}</h3><p>{session.subtitle}</p><button className="text-link" onClick={() => { const tracks = tracksFor(session.trackIds); music.setRepeat(podcasts ? 'off' : 'all'); music.playTrack(tracks[0], tracks) }}><Play size={13} fill="currentColor" />{podcasts ? 'Play episode' : 'Start station'}</button></div></article>)}</div><p className="demo-note">{podcasts ? 'These demo sessions feature instrumental music; spoken-word episodes are not included.' : 'Demo stations play locally bundled tracks on repeat. No live broadcast connection is needed.'}</p></>
}

function PlaylistsView() {
  const music = useMusic()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  return <><PageIntro eyebrow="A SPACE THAT’S YOURS" title="Your library." description="All your moods. All your moments. All right here."><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={17} />New playlist</button></PageIntro><LibraryTabs />{music.playlists.length > 0 && <section className="custom-playlists"><SectionHeading title="Made by you" /><div className="mix-grid">{music.playlists.map(mix => <MixCard key={mix.id} mix={{ ...mix, subtitle: `${mix.trackIds.length} tracks · Your playlist` }} />)}</div></section>}<SectionHeading title="Made for you" /><div className="mix-grid">{mixes.map((mix, index) => <MixCard key={mix.id} mix={mix} index={index} />)}</div><Link className="favorites-banner" href="/collection/tracks"><span className="favorites-icon"><Heart size={28} fill="currentColor" /></span><span><h3>Your favorites, together.</h3><p>{music.liked.length} songs you can&apos;t get enough of.</p></span><ArrowUpRight size={24} /></Link>{creating && <Modal title="A playlist of your own" onClose={() => setCreating(false)}><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; const playlist = music.createPlaylist(name); setCreating(false); router.push(`/playlist/${playlist.id}`) }}><label htmlFor="new-playlist" className="field-label">Playlist name</label><input id="new-playlist" className="text-field" maxLength={60} required value={name} onChange={event => setName(event.target.value)} placeholder="Late night thoughts..." /><button type="submit" className="button button-primary full-width" disabled={!name.trim()}>Create playlist</button></form></Modal>}</>
}

function LocalView() {
  const music = useMusic()
  const inputRef = useRef(null)
  return <><PageIntro eyebrow="BRING YOUR OWN SOUND" title="From your collection." description="Your files, with a fresh place to play." /><div className="upload-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); music.importFiles(event.dataTransfer.files) }}><span><Upload size={28} /></span><h2>A home for your own music.</h2><p>Drop your audio files here, or browse your device.</p><button className="button button-primary" onClick={() => inputRef.current.click()}><Plus size={17} />Choose audio files</button><small>MP3, WAV, OGG, M4A · Files stay on your device and are available for this session.</small><input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" multiple hidden onChange={event => { music.importFiles(event.target.files); event.target.value = '' }} /></div>{music.localTracks.length > 0 && <><SectionHeading title="Your local tracks" /><TrackList tracks={music.localTracks} /></>}</>
}

export default function MusicView() {
  const router = useRouter()
  const music = useMusic()
  const path = router.asPath.split('?')[0]
  if (path.startsWith('/search')) return <SearchView />
  if (path === '/collection/tracks') return <PlaylistView id="favorites" />
  if (path.startsWith('/playlist/')) return <PlaylistView id={router.query.playlist_id || path.split('/').pop()} />
  if (path.includes('artists')) return <ArtistsView />
  if (path.includes('podcasts') || path.includes('episodes') || router.query.tab === 'podcasts') return <RadioView podcasts />
  if (path.includes('albums')) return <><PageIntro eyebrow="MORE THAN JUST A SINGLE" title="Listen to the whole story." description="A collection of moments, made to be heard together." />{path.startsWith('/collection') && <LibraryTabs />}<div className="album-grid">{[...new Map(songs.map(song => [song.album, song])).values()].map(song => <article key={song.album} className="album-card"><button className="album-art" onClick={() => music.playTrack(song, songs.filter(item => item.album === song.album))} aria-label={`Play ${song.album}`}><img src={song.image} alt={`${song.album} album cover`} /><span><Play size={25} fill="currentColor" /></span></button><h3>{song.album}</h3><p>{song.artist}<span>·</span>2026</p></article>)}</div></>
  if (path === '/collection/playlists') return <PlaylistsView />
  if (path === '/genres') { const selected = genres.find(genre => genre.name === router.query.genre); return <><PageIntro eyebrow="THERE’S A SOUND FOR THAT" title={selected ? `${selected.name}, your way.` : 'What’s your mood?'} description={selected ? selected.caption : 'Big feelings. Quiet moments. Find a genre that gets you.'} /><GenreTiles full />{selected && <section className="genre-results"><SectionHeading title={`A little ${selected.name.toLowerCase()} goes a long way`} /><TrackList tracks={songs.filter(song => song.genre === selected.name)} showAlbum /></section>}</> }
  if (path === '/radio') return <RadioView />
  if (path === '/local' || path === '/download') return <LocalView />
  if (path === '/recent') return <><PageIntro eyebrow="SOUNDS LIKE YOU" title="Worth another listen." description="A little look back at where your ears have been." /><TrackList tracks={[...music.history.map(id => [...songs, ...music.localTracks].find(song => song.id === id)).filter(Boolean)]} showAlbum empty="Your listening story starts here." /></>
  if (path === '/charts') return <><PageIntro eyebrow="YOUR NEW OBSESSIONS" title="One more time." description="The tracks we keep coming back to. You might, too." /><TrackList tracks={songs} showAlbum /></>
  return <HomeView />
}
