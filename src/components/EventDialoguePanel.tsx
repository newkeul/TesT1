import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Character } from './CharacterPanel'
import type { StoryEvent } from './Timeline'

type Dialogue = { id:number; event_id:number; character_id:number; message:string; created_at:string }
type Props = { event:StoryEvent|null; characters:Character[] }

const request = async <T,>(path:string, init?:RequestInit):Promise<T> => {
  const response = await api(path, init)
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?:string }
    throw new Error(error.detail || '요청을 처리하지 못했어요.')
  }
  return response.json()
}

export default function EventDialoguePanel({ event, characters }:Props) {
  const [dialogues, setDialogues] = useState<Dialogue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cast = event ? characters.filter((person) => event.character_ids.includes(person.id)) : []
  const load = async () => {
    if (!event) { setDialogues([]); return }
    setLoading(true); setError('')
    try { setDialogues(await request<Dialogue[]>('events/' + event.id + '/dialogues')) }
    catch (err) { setError(err instanceof Error ? err.message : '대화를 불러오지 못했어요.') }
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
    if (!characterId || !message) return setError('말한 인물과 대사를 모두 입력해 주세요.')
    try {
      const item = await request<Dialogue>('events/' + event.id + '/dialogues', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ character_id:characterId, message }) })
      setDialogues((current) => [...current, item]); setError(''); form.reset()
    } catch (err) { setError(err instanceof Error ? err.message : '대사를 저장하지 못했어요.') }
  }
  const remove = async (id:number) => {
    if (!window.confirm('이 대사를 삭제할까요?')) return
    try { await request('dialogues/' + id, { method:'DELETE' }); setDialogues((current) => current.filter((item) => item.id !== id)) }
    catch (err) { setError(err instanceof Error ? err.message : '대사를 삭제하지 못했어요.') }
  }

  return <section className="event-dialogue-panel" aria-label="사건 속 인물 대화">
    <div className="section-heading compact"><div><p className="eyebrow">SCENE VOICES</p><h2>사건 속 대화</h2></div></div>
    {!event ? <p className="relationship-empty">타임라인에서 사건을 선택하면, 이 장면 속 인물들의 대화를 기록할 수 있어요.</p> : cast.length === 0 ? <p className="relationship-empty">이 사건에 등장인물을 연결하면 대사를 추가할 수 있어요.</p> : <>
      <p className="dialogue-event-title">「{event.title}」의 한마디</p>
      {loading ? <p className="mini-state">대화를 불러오는 중…</p> : dialogues.length === 0 ? <p className="relationship-empty">아직 남긴 대사가 없어요. 장면의 분위기를 한마디로 기록해 보세요.</p> : <ul className="dialogue-list">{dialogues.map((item) => {
        const person = characters.find((character) => character.id === item.character_id)
        if (!person) return null
        return <li key={item.id} className="dialogue-item">{person.photo_data ? <img src={person.photo_data} alt={person.name + ' 대표 사진'} /> : <span className="dialogue-avatar">{person.name.slice(0, 1)}</span>}<div><strong>{person.name}</strong><p>{item.message}</p></div><button type="button" className="delete-mini" onClick={() => remove(item.id)} aria-label={person.name + '의 대사 삭제'}>×</button></li>
      })}</ul>}
      <form className="dialogue-form" onSubmit={submit}><label>말한 인물<select name="character_id" defaultValue=""><option value="" disabled>인물을 선택하세요</option>{cast.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>대사<textarea name="message" maxLength={300} placeholder="이 장면에서 이 인물이 남긴 한마디" /></label><button className="save-button" type="submit">대사 추가</button></form>
      {error && <p className="form-error">{error}</p>}
    </>}
  </section>
}
