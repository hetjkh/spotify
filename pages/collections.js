import Link from 'next/link'
import { useRouter } from 'next/router'
import BookLibrary from '@/components/groovy/BookLibrary'
import { PlaylistsView } from '@/components/groovy/MusicView'

export default function CollectionsPage({ defaultChapters = false }) {
  const router = useRouter()
  const chapters = router.query.type ? router.query.type === 'chapters' : defaultChapters
  return <><div className="page-intro"><span className="eyebrow">YOUR LIBRARY, YOUR ORDER</span><h1>Collections</h1><p>Group whole books into book collections, or arrange individual chapters into chapter collections.</p></div><nav className="filter-tabs" aria-label="Collection type"><Link href="/collections" className={!chapters ? 'selected' : ''}>Whole books</Link><Link href="/collections?type=chapters" className={chapters ? 'selected' : ''}>Selected chapters</Link></nav>{chapters ? <PlaylistsView embedded /> : <BookLibrary collectionsOnly />}</>
}
