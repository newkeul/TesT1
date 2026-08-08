export type Affiliation = { id:number; name:string; description:string; color_r:number; color_g:number; color_b:number }
type Props = { affiliations:Affiliation[]; loading:boolean; onAdd:()=>void; onDelete:(id:number)=>void }
const rgb = (item:Affiliation) => `rgb(${item.color_r}, ${item.color_g}, ${item.color_b})`
export default function AffiliationPanel({affiliations,loading,onAdd,onDelete}:Props){
 return <aside className="affiliation-panel"><div className="section-heading compact"><div><p className="eyebrow">AFFILIATIONS</p><h2>소속</h2></div><button className="icon-button" title="소속 추가" onClick={onAdd}>＋</button></div>
 {loading ? <div className="mini-state">소속을 불러오는 중…</div> : affiliations.length===0 ? <div className="mini-state">아직 기록한 소속이 없어요.<button className="text-button" onClick={onAdd}>소속 추가하기</button></div> : <ul className="affiliation-list">{affiliations.map(item=><li key={item.id}><span className="affiliation-swatch" style={{backgroundColor:rgb(item)}} aria-label={`${item.name} 색상`} /><div><strong>{item.name}</strong><span>{item.description || `RGB ${item.color_r}, ${item.color_g}, ${item.color_b}`}</span></div><button className="delete-mini" aria-label={item.name+' 삭제'} onClick={()=>onDelete(item.id)}>×</button></li>)}</ul>}
 </aside>
}
