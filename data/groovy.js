export const artists = [
  { id: 'luna', name: 'Luna Grey', image: '/images/luna.jpg', listeners: '2.4M', genre: 'Dream pop' },
  { id: 'atlas', name: 'Atlas', image: '/images/atlas.jpg', listeners: '1.8M', genre: 'Electronic' },
  { id: 'nova', name: 'Nova', image: '/images/nova.jpg', listeners: '980K', genre: 'Indie' },
  { id: 'sol', name: 'Sol Rivers', image: '/images/sol.jpg', listeners: '1.2M', genre: 'Lo-fi' },
  { id: 'echo', name: 'Echo Park', image: '/images/echo.jpg', listeners: '860K', genre: 'Electronic' },
  { id: 'aurora', name: 'Aurora', image: '/images/aurora.jpg', listeners: '740K', genre: 'Ambient' },
]

export const songs = [
  { id: 'feelings', title: 'In My Feelings', artist: 'Luna Grey', artistId: 'luna', album: 'The Midnight Sessions', image: '/images/luna.jpg', genre: 'Dream pop', duration: 64, color: '#7561a0' },
  { id: 'nightfall', title: 'Nightfall', artist: 'Atlas', artistId: 'atlas', album: 'After Hours', image: '/images/nightfall.jpg', genre: 'Electronic', duration: 64, color: '#5f548e' },
  { id: 'weightless', title: 'Weightless', artist: 'Nova', artistId: 'nova', album: 'Soft Landing', image: '/images/bloom.jpg', genre: 'Indie', duration: 64, color: '#af6e7b' },
  { id: 'golden', title: 'Golden Hour', artist: 'Sol Rivers', artistId: 'sol', album: 'Little Moments', image: '/images/golden.jpg', genre: 'Lo-fi', duration: 64, color: '#b49458' },
  { id: 'neon', title: 'Neon Dreams', artist: 'Echo Park', artistId: 'echo', album: 'City Lights', image: '/images/live.jpg', genre: 'Electronic', duration: 64, color: '#7568ba' },
  { id: 'tides', title: 'Changing Tides', artist: 'Aurora', artistId: 'aurora', album: 'Somewhere, Elsewhere', image: '/images/coast.jpg', genre: 'Ambient', duration: 64, color: '#648b89' },
  { id: 'slow', title: 'Slow Mornings', artist: 'Sol Rivers', artistId: 'sol', album: 'Little Moments', image: '/images/sol.jpg', genre: 'Lo-fi', duration: 64, color: '#a28366' },
  { id: 'moon', title: 'Under the Moon', artist: 'Luna Grey', artistId: 'luna', album: 'The Midnight Sessions', image: '/images/aurora.jpg', genre: 'Dream pop', duration: 64, color: '#7b658f' },
].map(song => ({ ...song, src: `/audio/${song.id}.mp3` }))

export const mixes = [
  { id: 'after-hours', name: 'After Hours', subtitle: 'For when the world slows down.', image: '/images/nightfall.jpg', color: '#7561ba', tag: 'LATE NIGHT', trackIds: ['nightfall', 'feelings', 'neon', 'moon'] },
  { id: 'slow-mornings', name: 'Slow Mornings', subtitle: 'A little calm. A fresh start.', image: '/images/golden.jpg', color: '#bb8951', tag: 'EASY LISTENING', trackIds: ['slow', 'golden', 'weightless', 'tides'] },
  { id: 'in-bloom', name: 'In Full Bloom', subtitle: 'Good things are on their way.', image: '/images/bloom.jpg', color: '#bd7d91', tag: 'FEEL GOOD', trackIds: ['weightless', 'golden', 'feelings', 'moon'] },
  { id: 'coastline', name: 'Coastline', subtitle: 'Take the scenic route.', image: '/images/coast.jpg', color: '#5f9698', tag: 'UNWIND', trackIds: ['tides', 'slow', 'nightfall', 'golden'] },
]

export const genres = [
  { name: 'Electronic', color: '#3f526b', caption: 'Find your frequency', icon: 'wave' },
  { name: 'Dream pop', color: '#766484', caption: 'A softer kind of escape', icon: 'sparkles' },
  { name: 'Indie', color: '#9a624c', caption: 'A little off the beaten path', icon: 'sun' },
  { name: 'Lo-fi', color: '#477976', caption: 'Ease into the moment', icon: 'coffee' },
  { name: 'Ambient', color: '#6e668f', caption: 'Room to breathe', icon: 'moon' },
]

export const sessions = [
  { id: 'session-1', name: 'The Listening Room', subtitle: 'Episode 01 · An electronic escape', image: '/images/atlas.jpg', trackIds: ['nightfall', 'neon', 'feelings'] },
  { id: 'session-2', name: 'A Quiet Kind of Sunday', subtitle: 'Episode 02 · Slow sounds, good company', image: '/images/golden.jpg', trackIds: ['slow', 'golden', 'tides'] },
  { id: 'session-3', name: 'Somewhere After Dark', subtitle: 'Episode 03 · Music for the night owls', image: '/images/nightfall.jpg', trackIds: ['moon', 'nightfall', 'feelings'] },
]

export const tracksFor = ids => ids.map(id => songs.find(song => song.id === id)).filter(Boolean)
export const formatTime = seconds => `${Math.floor((Number(seconds) || 0) / 60)}:${String(Math.floor((Number(seconds) || 0) % 60)).padStart(2, '0')}`
