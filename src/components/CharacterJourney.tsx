import { useState } from 'react'
import type { Character } from './CharacterPanel'
import type { StoryEvent } from './Timeline'
type Props = {
  characters: Character[]
  events: StoryEvent[]
  selectedCharacterId: number | null
  onSelectCharacter: (id: number) => void
  onEditEvent: (event: StoryEvent) => void
}
const dateLabel = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
}).format(new Date(value))
export default function CharacterJourney({ characters, events, selectedCharacterId, onSelectCharacter, onEditEvent }: Props) {
  const [isExpanded, setIsExpanded] = useState(true)
  const selected = characters.find((person) => person.id === selectedCharacterId) || null
  const journey = selected ? events.filter((event) => event.character_ids.includes(selected.id)) : []
  return <section className="journey-panel" aria-label="인물 변화 기록">
    <div className="section-heading journey-heading"><div><p className="eyebrow">CHARACTER ARC</p><h2>인물의 이야기 흐름</h2></div><button type="button" className="journey-toggle" onClick={() => setIsExpanded((current) => !current)} aria-expanded={isExpanded} aria-controls="character-journey-content">{isExpanded ? '접기 ▲' : '펼치기 ▼'}</button></div>
    {isExpanded && <div id="character-journey-content">{characters.length === 0 ? <p className="relationship-empty">먼저 등장인물을 추가하면 인물별 이야기 흐름을 볼 수 있어요.</p> : <>
      <div className="journey-people" role="list" aria-label="인물 선택">
        {characters.map((person) => <button key={person.id} type="button" role="listitem" className={'journey-person ' + (selected?.id === person.id ? 'journey-person-active' : '')} onClick={() => onSelectCharacter(person.id)} aria-pressed={selected?.id === person.id}>
          {person.photo_data ? <img src={person.photo_data} alt="" /> : <span>{person.name.slice(0, 1)}</span>}<b>{person.name}</b>
        </button>)}
      </div>
      {selected && <div className="journey-content">
        <div className="journey-summary">{selected.photo_data ? <img src={selected.photo_data} alt={selected.name + ' 대표 사진'} /> : <span className="journey-avatar">{selected.name.slice(0, 1)}</span>}<div><strong>{selected.name}의 변화</strong><p>{selected.description || '인물이 거쳐 가는 장면과 변화를 기록해 보세요.'}</p></div></div>
        {journey.length === 0 ? <p className="relationship-empty">아직 이 인물이 연결된 사건이 없어요. 사건을 추가하거나 수정할 때 이 인물을 선택해 주세요.</p> : <ol className="journey-list">{journey.map((event) => <li key={event.id}><div className="journey-point" /><article><time>{dateLabel(event.happened_at)}</time><strong>{event.title}</strong><p>{event.description || '변화 메모가 아직 없어요. 사건을 수정해 장면의 의미를 남겨 보세요.'}</p><button type="button" className="text-button journey-edit" onClick={() => onEditEvent(event)}>이 장면 다듬기</button></article></li>)}</ol>}
      </div>}
    </>}</div>}
  </section>
}
