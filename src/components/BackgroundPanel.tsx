export type StoryBackground = { id:number; name:string; description:string; photo_data:string }
type Props = { backgrounds:StoryBackground[]; onAdd:()=>void; onEdit:(item:StoryBackground)=>void; onDelete:(id:number)=>void; loading:boolean }
const tones=['lavender','mint','peach','sky','butter']
export default function BackgroundPanel({backgrounds,onAdd,onEdit,onDelete,loading}:Props) {
 return <aside className="background-panel"><div className="section-heading compact"><div><p className="eyebrow">PLACES</p><h2>배경</h2></div><button className="icon-button" title="배경 추가" onClick={onAdd}>＋</button></div>
 {loading ? <div className="mini-state">배경을 불러오는 중…</div> : backgrounds.length===0 ? <div className="mini-state">아직 기록한 배경이 없어요.<button className="text-button" onClick={onAdd}>배경 추가하기</button></div> : <ul className="character-list">{backgrounds.map((place,i)=><li key={place.id}>{place.photo_data ? <img className="avatar avatar-photo" src={place.photo_data} alt={place.name+' 대표 사진'} /> : <span className={'avatar background-avatar '+tones[i%tones.length]}>⌂</span>}<button className="character-item" onClick={()=>onEdit(place)}><strong>{place.name}</strong><span>{place.description || '설명이 아직 없어요.'}</span></button><button className="delete-mini" aria-label={place.name+' 삭제'} onClick={()=>onDelete(place.id)}>×</button></li>)}</ul>}
 </aside>
}
