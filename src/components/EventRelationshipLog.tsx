import type { Character } from './CharacterPanel'
import type { Relationship } from './RelationshipMap'
import type { StoryEvent } from './Timeline'
type Props = {
  events: StoryEvent[]
  characters: Character[]
  relationships: Relationship[]
}
const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
}).format(new Date(value))
export default function EventRelationshipLog({ events, characters, relationships }: Props) {
  const personFor = (id: number) => characters.find((person) => person.id === id)
  const linkedEvents = events.map((event) => ({
    event,
    relations: relationships.filter((relation) => relation.origin_event_id === event.id)
  })).filter(({ relations }) => relations.length > 0)
  return <section className="event-relationship-log" aria-label="사건별 관계 기록">
    <div className="section-heading compact"><div><p className="eyebrow">STORY CONNECTIONS</p><h2>사건 속 관계</h2></div></div>
    {events.length === 0 ? <p className="relationship-empty">사건을 기록하면, 그 장면에서 만들어진 인물 관계를 모아 볼 수 있어요.</p> : relationships.length === 0 ? <p className="relationship-empty">관계도에서 개인 관계를 추가하고, 관계가 만들어진 사건을 함께 선택해 주세요.</p> : linkedEvents.length === 0 ? <p className="relationship-empty">아직 관계가 만들어진 사건을 기록하지 않았어요. 개인 관계를 추가할 때 해당 사건을 선택해 보세요.</p> : <ol className="event-relationship-list">{linkedEvents.map(({ event, relations }) => <li key={event.id}>
      <div className="event-relationship-date"><span />{formatDate(event.happened_at)}</div>
      <article className="event-relationship-card"><h3>{event.title}</h3><p className="event-relationship-cast">등장 · {event.character_ids.map((id) => personFor(id)?.name).filter(Boolean).join(' · ')}</p>
        <ul>{relations.map((relation) => {
          const from = personFor(relation.from_id)
          const to = personFor(relation.to_id)
          if (!from || !to) return null
          return <li key={relation.id}><div className="relation-pair">{from.photo_data ? <img src={from.photo_data} alt="" /> : <i>{from.name.slice(0, 1)}</i>}<strong>{from.name}</strong><span>↔</span>{to.photo_data ? <img src={to.photo_data} alt="" /> : <i>{to.name.slice(0, 1)}</i>}<strong>{to.name}</strong></div><b>{relation.relation_type}</b>{relation.description && <p>{relation.description}</p>}</li>
        })}</ul>
      </article>
    </li>)}</ol>}
  </section>
}
