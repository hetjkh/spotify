import '@/styles/groovy.css'
import { MotionConfig } from 'framer-motion'
import { MusicProvider } from '@/components/groovy/MusicProvider'
import GroovyLayout from '@/components/groovy/GroovyLayout'

export default function App({ Component, pageProps }) {
  return <MotionConfig reducedMotion="user"><MusicProvider>{Component.standalone ? <Component {...pageProps} /> : <GroovyLayout><Component {...pageProps} /></GroovyLayout>}</MusicProvider></MotionConfig>
}
