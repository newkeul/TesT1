import type { Affiliation } from './AffiliationPanel'
export type Character = { id:number; name:string; description:string; photo_data:string; affiliation_ids:number[] }
type Props = { characters:Character[]; affiliations:Affiliation[]; activeAffiliationId:number|null; onFilter:(id:number|null)=>void; onAdd:()=>void; onEdit:(item:Character)=>void; onDelete:(id:number)=>void; loading:boolean }
const colors=['lavender','mint','peach','sky','butter']
export default function CharacterPanel({characters,affiliations,activeAffiliationId,onFilter,onAdd,onEdit,onDelete,loading}:Props) {
 const affiliationNames=(person:Character)=>person.affiliation_ids.map(id=>affiliations.find(item=>item.id===id)?.name).filter(Boolean).join(' · ')
 return <aside className="character-panel"><div className="section-heading compact"><div><p className="eyebrow">CAST</p><h2>등장인물</h2></div><button className="icon-button" title="인물 추가" onClick={onAdd}>＋</button></div>
 {!loading&&<div className="character-filters" aria-label="소속별 인물 보기"><button className={!activeAffiliationId?'filter-active':''} onClick={()=>onFilter(null)}>전체</button>{affiliations.map(item=><button key={item.id} className={activeAffiliationId===item.id?'filter-active':''} onClick={()=>onFilter(item.id)}><i style={{backgroundColor:`rgb(${item.color_r}, ${item.color_g}, ${item.color_b})`}} />{item.name}</button>)}</div>}
 {loading ? <div className="mini-state">인물을 불러오는 중…</div> : characters.length===0 ? <div className="mini-state">아직 등장인물이 없어요.<button className="text-button" onClick={onAdd}>인물 추가하기</button></div> : <ul className="character-list">{characters.map((person,i)=><li key={person.id}>{person.photo_data ? <img className="avatar avatar-photo" src={person.photo_data} alt={person.name+' 대표 사진'} /> : <span className={'avatar '+colors[i%colors.length]}>{person.name.slice(0,1)}</span>}<button className="character-item" onClick={()=>onEdit(person)}><strong>{person.name}</strong><span>{affiliationNames(person)||person.description||'설명이 아직 없어요.'}</span></button><button className="delete-mini" aria-label={person.name+' 삭제'} onClick={()=>onDelete(person.id)}>×</button></li>)}</ul>}
 </aside>
}
