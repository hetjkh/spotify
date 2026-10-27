export const genres = [
  { name: 'Fiction', color: '#1c1c1c', caption: 'Stories that stay with you', icon: 'book' },
  { name: 'Mystery', color: '#2a2a2a', caption: 'Questions in the dark', icon: 'sparkles' },
  { name: 'Literary', color: '#363636', caption: 'Language as landscape', icon: 'sun' },
  { name: 'Self-help', color: '#444444', caption: 'A quieter kind of progress', icon: 'coffee' },
  { name: 'Fantasy', color: '#555555', caption: 'Other worlds, same hunger', icon: 'moon' },
  { name: 'Sci-fi', color: '#666666', caption: 'Tomorrow in headphones', icon: 'moon' },
  { name: 'History', color: '#777777', caption: 'Voices from the past', icon: 'book' },
  { name: 'Biography', color: '#888888', caption: 'Lives worth hearing', icon: 'sun' },
]

export const formatTime = seconds => {
  const value = Number(seconds) || 0
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`
}

export const PLACEHOLDER_COVER = '/groovy.svg'
