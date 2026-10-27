import '@/styles/groovy.css'
import '@/styles/workspace.css'
import '@/styles/listening-studio.css'
import '@/styles/browse.css'
import '@/styles/book-detail.css'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from '@/components/groovy/AuthProvider'
import { MusicProvider } from '@/components/groovy/MusicProvider'
import GroovyLayout from '@/components/groovy/GroovyLayout'

export default function App({ Component, pageProps }) {
  return <MotionConfig reducedMotion="user"><AuthProvider><MusicProvider>{Component.standalone ? <Component {...pageProps} /> : <GroovyLayout><Component {...pageProps} /></GroovyLayout>}</MusicProvider></AuthProvider></MotionConfig>
}
