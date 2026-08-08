import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Character } from './CharacterPanel'
import type { StoryEvent } from './Timeline'
type Dialogue = { id:number; event_id:number; character_id:number; message:string; created_at:string }
type Props = { event:StoryEvent|null; characters:Character[]; onClose:()=>void }
const request = async <T,>(path:string, init?:RequestInit):Promise<T> => {
  const response = await api(path, init)
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?:string }
    throw new Error(error.detail || '요청을 처리하지 못했어요.')
  }
  return response.json()
}
export default function EventCommentModal({ event, characters, onClose }: Props) {
  const [dialogues, setDialogues] = useState<Dialogue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    if (!event) return
    setLoading(true)
    setError('')
    try { setDialogues(await request<Dialogue[]>('events/' + event.id + '/dialogues')) }
    catch (err) { setError(err instanceof Error ? err.message : '코멘트를 불러오지 못했어요.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [event?.id])
  const submit = async (formEvent:FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    if (!event) return
    const form = formEvent.currentTarget
    const data = new FormData(form)
    const characterId = Number(data.get('character_id'))
    const message = String(data.get('message') || '').trim()
    if (!characterId || !message) return setError('말한 인물과 코멘트를 모두 입력해 주세요.')
    try {
      const item = await request<Dialogue>('events/' + event.id + '/dialogues', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ character_id:characterId, message })
      })
      setDialogues((current) => [...current, item])
      setError('')
      form.reset()
    } catch (err) { setError(err instanceof Error ? err.message : '코멘트를 저장하지 못했어요.') }
  }
  const remove = async (id:number) => {
    if (!window.confirm('이 코멘트를 삭제할까요?')) return
    try {
      await request('dialogues/' + id, { method:'DELETE' })
      setDialogues((current) => current.filter((item) => item.id !== id))
    } catch (err) { setError(err instanceof Error ? err.message : '코멘트를 삭제하지 못했어요.') }
  }
  if (!event) return null
  return <div className="comment-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="comment-modal" role="dialog" aria-modal="true" aria-label={event.title + ' 사건 코멘트'} onMouseDown={(e) => e.stopPropagation()}>
      <header className="comment-modal-head">
        <div><p className="eyebrow">SCENE CHAT</p><h2>{event.title}</h2><p>이 사건에 대한 인물들의 대화</p></div>
        <button type="button" className="close-button" onClick={onClose} aria-label="코멘트 창 닫기">×</button>
      </header>
      <div className="chat-thread" aria-live="polite">
        {loading ? <p className="mini-state">코멘트를 불러오는 중…</p> : dialogues.length === 0 ? <div className="chat-empty"><span>✦</span><strong>아직 남긴 코멘트가 없어요.</strong><p>원하는 인물을 골라 이 장면의 한마디를 남겨 보세요.</p></div> : dialogues.map((item) => {
          const person = characters.find((character) => character.id === item.character_id)
          if (!person) return null
          return <article key={item.id} className="chat-message">
            {person.photo_data ? <img src={person.photo_data} alt={person.name + ' 대표 사진'} /> : <span className="chat-avatar">{person.name.slice(0, 1)}</span>}
            <div className="chat-bubble-wrap"><strong>{person.name}</strong><p className="chat-bubble">{item.message}</p></div>
            <button type="button" className="chat-delete" onClick={() => remove(item.id)} aria-label={person.name + '의 코멘트 삭제'}>×</button>
          </article>
        })}
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <label>말한 인물<select name="character_id" defaultValue=""><option value="" disabled>인물을 선택하세요</option>{characters.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        <label>코멘트<textarea name="message" maxLength={300} placeholder="이 사건을 본 인물의 한마디를 적어 보세요." /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="save-button" type="submit">보내기</button>
      </form>
    </section>
  </div>
}
