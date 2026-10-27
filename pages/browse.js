import { useRouter } from 'next/router'
import { BooksView, GenrePage } from '@/components/groovy/MusicView'
import DiscoveryChannels from '@/components/groovy/DiscoveryChannels'
import PeopleDirectory from '@/components/groovy/PeopleDirectory'

export default function BrowsePage() {
  const router = useRouter()
  const tab = router.query.tab || 'books'
  if (tab === 'categories') return <GenrePage />
  if (tab === 'popular' || tab === 'new') return <DiscoveryChannels key={tab} mode="charts" initialSort={tab === 'new' ? 'newest' : 'plays'} />
  if (tab === 'people') return <PeopleDirectory />
  return <BooksView />
}
