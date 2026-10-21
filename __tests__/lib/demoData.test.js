import demoHandler from '@/lib/demoData'

function request(endpoint, query = {}) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  demoHandler(endpoint)({ query }, res)
  expect(res.status).toHaveBeenCalledWith(200)
  return res.json.mock.calls[0][0]
}

describe('UI preview content without authentication', () => {
  it('supplies home content and respects requested limits', () => {
    expect(request('getRecentlyPlayed', { limit: '3' })).toHaveLength(3)
    expect(request('getRecentlyPlayed')[0].album.image).toMatch(/^\//)
    expect(request('getTopArtists').length).toBeGreaterThan(0)
  })

  it('supplies playlist tracks and player metadata with matching ids', () => {
    const playlist = request('getPlaylist', { playlist_id: 'playlist-1' })
    const track = request('getTrackInformations', { id: playlist.tracks[0].id })
    expect(playlist.id).toBe('playlist-1')
    expect(track.name).toBe(playlist.tracks[0].name)
    expect(track.artists[0].name).toBeTruthy()
    expect(track.album.name).toBeTruthy()
  })

  it('supplies array artist fields for library pages', () => {
    expect(Array.isArray(request('getLikedAlbums')[0].artist)).toBe(true)
    expect(Array.isArray(request('getLikedTracks')[0].artist)).toBe(true)
  })

  it('filters search content and supplies album tab fields', () => {
    const albums = request('search/albums', { searchInput: 'midnight' })
    expect(albums).toHaveLength(1)
    expect(albums[0].releaseDate.split('-')[0]).toBe('2026')
    expect(albums[0].artists.join(', ')).toBe('Luna')
    expect(albums[0].cover_url).toMatch(/^\//)
    expect(request('search/', { searchInput: 'no-such-title' }).bestResult).toEqual({})
  })
})
