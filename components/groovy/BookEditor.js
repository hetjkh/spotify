import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowDown, ArrowUp, FileAudio, Save, Trash2 } from 'lucide-react'
import { api, fileUrl } from '@/lib/api'
import { useAuth } from './AuthProvider'

export default function BookEditor() {
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const edited = useRef({})
  useEffect(() => {
    if (!router.query.id) return
    let active = true
    setBook(null); setError(''); edited.current = {}
    api(`/books/${router.query.id}`).then(data => { if (active) setBook(data.book) }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [router.query.id])
  if (!user) return <p>Sign in to edit your books.</p>
  if (!book) return <p role={error ? 'alert' : undefined}>{error || 'Loading book...'}</p>
  if (String(book.owner?.id || book.owner) !== String(user.id)) return <p>You can edit your own books.</p>
  const move = (index, delta) => setBook(previous => {
    const chapters = [...previous.chapters]
    ;[chapters[index], chapters[index + delta]] = [chapters[index + delta], chapters[index]]
    return { ...previous, chapters }
  })
  const submit = async event => {
    event.preventDefault()
    const native = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      const form = new FormData()
      const value = key => edited.current[key] ?? native.get(key) ?? book[key] ?? ''
      for (const key of ['title','description','genre','authorName','narrator','language','series','seriesIndex','sampleChapter','year','visibility']) form.append(key, value(key))
      form.append('chapters', JSON.stringify(book.chapters.map(ch => ({ id: String(ch._id), title: value('chapter-' + ch._id) || ch.title }))))
      const cover = native.get('cover')
      if (cover?.size) form.append('cover', cover)
      for (const chapter of book.chapters) {
        const file = native.get('replacement-' + chapter._id)
        if (file?.size) { form.append('audio', file); form.append('replacementIds', chapter._id); form.append('chapterTitles', value('chapter-' + chapter._id) || chapter.title) }
      }
      for (const file of native.getAll('newAudio').filter(file => file.size)) { form.append('audio', file); form.append('replacementIds', 'new'); form.append('chapterTitles', file.name.replace(/\.[^.]+$/, '')) }
      await api(`/books/${book.id}`, { method: 'PATCH', body: form })
      router.push(`/listen/${book.id}`)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <form className="listening-dashboard book-editor" onSubmit={submit} onInputCapture={event => { if (event.target.name && event.target.type !== 'file') edited.current[event.target.name] = event.target.value }}>
    <div className="page-intro"><span className="eyebrow">MANAGE YOUR AUDIOBOOK</span><div><h1>Edit your book</h1><Link className="button button-quiet" href={`/listen/${book.id}`}>View book</Link></div><p>Update book details, replace recordings, and arrange chapters in listening order.</p></div>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <section className="dashboard-panel"><h2>Book details</h2><div className="editor-metadata"><aside><img className="editor-cover" src={fileUrl(book.coverUrl)} alt="Current book cover" /><label className="field-label">Replace cover<input type="file" name="cover" accept="image/png,image/jpeg,image/webp" /></label></aside><div className="dashboard-book-grid">{['title','authorName','narrator','genre','language','series','seriesIndex','sampleChapter','year'].map(key => <label className="field-label" key={key}>{({authorName:'Author',seriesIndex:'Book number',sampleChapter:'Sample chapter'})[key] || key}<input name={key} className="text-field" required={key === 'title'} type={['seriesIndex','sampleChapter'].includes(key) ? 'number' : 'text'} min="1" defaultValue={book[key] ?? ''} /></label>)}<label className="field-label">Visibility<select name="visibility" className="text-field" defaultValue={book.visibility}><option value="private">Private - only you</option><option value="public">Public - everyone</option></select></label></div></div><label className="field-label">Description<textarea name="description" className="text-field" rows={4} defaultValue={book.description} /></label></section>
    <section><div className="section-heading"><h2>Chapters</h2><span className="muted">{book.chapters.length} recordings</span></div>{book.chapters.map((chapter,index) => <article className="dashboard-panel" key={chapter._id}><label className="field-label">Chapter {index + 1}<input name={'chapter-' + chapter._id} className="text-field" defaultValue={chapter.title} required /></label><label className="field-label">Replace audio<input name={'replacement-' + chapter._id} type="file" accept="audio/*" /></label><div className="collection-controls"><button type="button" className="button button-quiet" disabled={!index} onClick={() => move(index,-1)}><ArrowUp size={14} />Move up</button><button type="button" className="button button-quiet" disabled={index === book.chapters.length - 1} onClick={() => move(index,1)}><ArrowDown size={14} />Move down</button><button type="button" className="button button-quiet danger-action" disabled={book.chapters.length === 1} onClick={() => setBook(previous => ({ ...previous, chapters: previous.chapters.filter(ch => ch._id !== chapter._id) }))}><Trash2 size={14} />Remove chapter</button></div></article>)}</section>
    <section className="dashboard-panel"><h2><FileAudio size={20} /> Add more audio</h2><label className="field-label">Append new chapters<input name="newAudio" type="file" accept="audio/*" multiple /></label><p className="muted">New files will be added after your existing chapters.</p></section><button type="submit" className="button button-primary editor-save" disabled={busy}><Save size={16} />{busy ? 'Saving...' : 'Save book'}</button>
  </form>
}
