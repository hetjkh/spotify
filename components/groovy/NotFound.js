import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, AudioLines } from 'lucide-react'
export default function NotFound() {
  return <><Head><title>Off the record — Groovy</title></Head><main className="error-page"><AudioLines size={42} /><span className="eyebrow">404 · OFF THE RECORD</span><h1>We lost the rhythm.</h1><p>This page isn&apos;t in the collection. Let&apos;s find your way back.</p><Link href="/" className="button button-primary"><ArrowLeft size={16} />Back to discovering</Link></main></>
}
NotFound.standalone = true
