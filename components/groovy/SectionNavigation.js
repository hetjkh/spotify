import Link from 'next/link'
import { useRouter } from 'next/router'

export const browsePaths = ['/browse', '/albums', '/genres', '/charts', '/radio', '/artists']
export const libraryPaths = ['/library', '/collections', '/collection/tracks', '/collection/playlists', '/collection/albums', '/collection/artists', '/collection/podcasts', '/collection/episodes', '/recent', '/bookmarks', '/download', '/local']

export const browseSections = [['books', 'All books'], ['categories', 'Categories'], ['popular', 'Popular'], ['new', 'New releases'], ['people', 'Authors & narrators']]

export function browseSectionId(router) {
  const path = router.asPath.split('?')[0]
  const tab = path === '/browse' ? router.query.tab || 'books' : ({ '/albums': 'books', '/genres': 'categories', '/charts': 'popular', '/artists': 'people' })[path] || (path.startsWith('/narrator/') ? 'people' : 'books')
  return tab === 'stations' ? 'books' : tab
}

export function BrowseSectionLinks({ className = 'browse-subnav' }) {
  const router = useRouter()
  const tab = browseSectionId(router)
  return <nav className={className} aria-label="Browse sections">{browseSections.map(([id, label]) => <Link key={id} href={`/browse${id === 'books' ? '' : `?tab=${id}`}`} className={tab === id ? 'selected' : ''} aria-current={tab === id ? 'page' : undefined}>{label}</Link>)}</nav>
}

export const librarySections = [['books','My books','/library'],['continue','Continue listening','/library?status=in_progress'],['want','Want to listen','/library?status=want_to_listen'],['liked','Liked chapters','/collection/tracks'],['collections','Collections','/collections'],['bookmarks','Bookmarks','/bookmarks'],['downloads','Downloads','/download'],['import','Import audio','/local']]

export function librarySectionId(router) {
  const path = router.asPath.split('?')[0]
  if (path === '/library') return ['saved','wishlist','want_to_listen'].includes(router.query.status) ? 'want' : router.query.status === 'in_progress' ? 'continue' : 'books'
  if (path === '/recent') return 'continue'
  if (path === '/collections' || path === '/collection/playlists' || path.startsWith('/playlist/')) return 'collections'
  return ({ '/collection/tracks':'liked', '/bookmarks':'bookmarks', '/download':'downloads', '/local':'import' })[path]
}

export function LibrarySectionLinks({ className = 'browse-subnav' }) {
  const router = useRouter()
  const active = librarySectionId(router)
  return <nav className={className} aria-label="Library sections">{librarySections.map(([id, label, href]) => <Link key={id} href={href} className={active === id ? 'selected' : ''} aria-current={active === id ? 'page' : undefined}>{label}</Link>)}</nav>
}

export const dashboardSections = [['continue','Continue','#continue-listening'],['week','This week','#this-week'],['next','Try next','#try-next'],['prefs','Preferences','#listening-preferences']]

export function DashboardSectionLinks({ className = 'browse-subnav-mobile' }) {
  const router = useRouter()
  const hash = router.asPath.split('#')[1]
  return <nav className={className} aria-label="Dashboard sections">{dashboardSections.map(([id, label, href]) => <Link key={id} href={href} className={hash === href.slice(1) ? 'selected' : ''}>{label}</Link>)}</nav>
}

export function SectionNavigation() {
  const router = useRouter()
  const path = router.asPath.split('?')[0]
  if (browsePaths.includes(path) || path.startsWith('/narrator/') || path.startsWith('/series/')) return null
  if (libraryPaths.includes(path) || path.startsWith('/playlist/')) return null
  if (path === '/creator' || path === '/upload' || path.startsWith('/edit/')) return <nav className="section-navigation" aria-label="Creator workspace"><Link href="/creator" className={path === '/creator' ? 'selected' : ''}>My uploads</Link><Link href="/upload" className={path === '/upload' ? 'selected' : ''}>Upload a book</Link><Link href="/profile">Creator profile</Link></nav>
  return null
}
