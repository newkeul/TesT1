import type { Character } from './CharacterPanel'
export type Relationship = { id:number; from_id:number; to_id:number; relation_type:string; description:string; origin_event_id:number|null }
export type RelationshipGroup = { id:number; name:string; description:string; character_ids:number[]; origin_event_id:number|null }
type Props = {
  characters:Character[]
  relationships:Relationship[]
  groups:RelationshipGroup[]
  onAddPersonal:()=>void
  onDeletePersonal:(id:number)=>void
  onDeleteGroup:(id:number)=>void
}
export default function RelationshipMap({characters,relationships,groups,onAddPersonal,onDeletePersonal,onDeleteGroup}:Props){
  const nameFor = (id:number) => characters.find(person=>person.id===id)?.name || '알 수 없는 인물'
  const hasRecords = relationships.length + groups.length > 0
  return <section className="relationship-panel" aria-label="관계 목록">
    <div className="section-heading compact relationship-heading"><div><p className="eyebrow">CONNECTIONS</p><h2>관계도</h2></div></div>
    <section className="relation-section">
      <div className="relation-section-head"><div><strong>관계</strong><p>두 명 이상이 함께하는 모든 관계를 기록해요.</p></div><button className="add-button small" onClick={onAddPersonal} aria-label="관계 추가">＋</button></div>
      {characters.length < 2 ? <p className="relationship-empty">관계를 만들려면 인물을 두 명 이상 추가해 주세요.</p> : !hasRecords ? <p className="relationship-empty">아직 기록된 관계가 없어요.</p> : <ul className="relationship-record-list">{relationships.map(relation=><li key={'pair-'+relation.id} className="relationship-record"><div><strong>{nameFor(relation.from_id)} <span>·</span> {nameFor(relation.to_id)}</strong><b>{relation.relation_type}</b>{relation.description && <p>{relation.description}</p>}</div><button onClick={()=>onDeletePersonal(relation.id)} aria-label="관계 삭제">×</button></li>)}{groups.map(group=><li key={'group-'+group.id} className="relationship-record group-record"><div><strong>{group.name}</strong><span className="member-count">{group.character_ids.length}명 참여</span><p className="member-names">{group.character_ids.map(nameFor).join(' · ')}</p>{group.description && <p>{group.description}</p>}</div><button onClick={()=>onDeleteGroup(group.id)} aria-label="관계 삭제">×</button></li>)}</ul>}
    </section>
  </section>
}
