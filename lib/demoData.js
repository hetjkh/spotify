// Local content for designing the app without a Spotify account or API keys.
const covers = ['/search_cover.jpg', '/search_cover2.jpg', '/episodes_cover.jpg']
const names = ['Midnight Drive', 'Slow Mornings', 'After Hours', 'Golden Days', 'Deep Focus', 'Weekend Mix', 'Ocean Waves', 'City Lights']
export const artists = names.map((name, index) => ({
  id: `artist-${index}`, name: ['Luna', 'The Coast', 'Atlas', 'Nova', 'Echo', 'Sol', 'Indigo', 'Aurora'][index],
  image: covers[index % covers.length],
}))
export const albums = names.map((name, index) => ({
  id: `album-${index}`, name, image: covers[index % covers.length],
  artist: artists[index].name, artists: artists[index].name,
  description: `2026 • ${artists[index].name}`,
}))
export const tracks = albums.map((album, index) => ({
  id: `track-${index}`, name: album.name, title: album.name,
  artist: album.artist, artists: [{ name: album.artist, id: artists[index].id }],
  album: album.name, image: album.image, cover_url: album.image,
  explicit: false, duration: 180000 + index * 10000,
  addedDate: 'Today', added_date: 'Today',
}))
export const playlists = names.map((name, index) => ({
  id: `playlist-${index}`, name, image: covers[index % covers.length],
  description: 'A mix for every moment.', author: 'UI Preview', owner: 'UI Preview',
  followers: 128, full_tracks: true, tracks,
}))
export const podcasts = names.slice(0, 4).map((name, index) => ({
  id: `podcast-${index}`, name: `${name} Radio`, image: covers[index % covers.length],
  author: 'Studio Sessions', artist: 'Studio Sessions', publisher: 'Studio Sessions',
}))
export const episodes = podcasts.map((podcast, index) => ({
  ...podcast, id: `episode-${index}`, podcast: podcast.name,
  name: `Episode ${index + 1}: Creative moments`, description: 'Stories, music, and inspiration for your day.',
  release_date: '21 Oct.', publicationDate: '21 Oct.', duration: '24 min', explicit: false,
}))

function searchResults(input) {
  const query = String(input || '').toLowerCase()
  const matches = items => items.filter(item => `${item.name} ${item.artist || ''} ${item.description || ''}`.toLowerCase().includes(query))
  const foundTracks = matches(tracks)
  const first = foundTracks[0] || matches(albums)[0] || matches(artists)[0] || matches(playlists)[0] || matches(podcasts)[0]
  return {
    bestResult: first ? { title: first.name, category: 'Preview', image: first.image, artist: first.artist, link: '/' } : {},
    tracks: foundTracks, albums: matches(albums), artists: matches(artists),
    playlists: matches(playlists), podcasts: matches(podcasts), episodes: matches(episodes),
  }
}

export default function demoHandler(endpoint) {
  return function handler(req, res) {
    const { limit, id, playlist_id, searchInput } = req.query
    let result
    switch (endpoint) {
      case 'getPlaylists': result = playlists; break
      case 'getPlaylist': result = { ...(playlists.find(item => item.id === playlist_id) || playlists[0]), id: playlist_id || playlists[0].id }; break
      case 'getTopArtists':
      case 'getFollowedArtists':
      case 'getRelatedArtists': result = artists; break
      case 'getLikedAlbums': result = albums.map(album => ({ ...album, artist: [album.artist] })); break
      case 'getNewAlbumReleases': result = albums; break
      case 'getLikedPodcasts': result = podcasts; break
      case 'getSavedEpisodes': result = episodes; break
      case 'getRecentlyPlayed': result = tracks.map((track, index) => ({ ...track, album: albums[index] })); break
      case 'getTrackInformations': result = { ...(tracks.find(track => track.id === id) || tracks[0]), soundType: 'track', album: { name: (tracks.find(track => track.id === id) || tracks[0]).album } }; break
      case 'getTracksQueue': result = tracks.map(track => track.id); break
      case 'getLikedTracks': result = tracks.map(track => ({ ...track, artist: [track.artist], duration: '3:00' })); break
      case 'getTopTracks': result = tracks; break
      case 'addLikedTracks':
      case 'deleteLikedTracks': result = { preview: true }; break
      default: {
        const results = searchResults(searchInput)
        const category = endpoint.split('/')[1]
        result = category ? results[category] : results
        if (category === 'tracks') result = result.map(track => ({ ...track, duration: '3:00' }))
        if (category === 'albums') result = result.map(album => ({ ...album, cover_url: album.image, releaseDate: '2026-01-01', artists: [album.artist] }))
        if (['artists', 'playlists', 'podcasts'].includes(category)) result = result.map(item => ({ ...item, cover_url: item.image }))
      }
    }
    if (Array.isArray(result) && limit !== undefined) {
      const count = Number(limit)
      if (Number.isFinite(count) && count >= 0) result = result.slice(0, count)
    }
    res.status(200).json(result)
  }
}
