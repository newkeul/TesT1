export type StoryEvent = { id:number; title:string; happened_at:string; description:string; photo_data:string; character_ids:number[]; background_ids:number[] }
type Props = { events: StoryEvent[]; selectedId:number | null; onSelect:(item:StoryEvent)=>void; onAdd:()=>void; onComment:(item:StoryEvent)=>void; loading:boolean; error:string; characterNames:Record<number,string>; backgroundNames:Record<number,string> }
const formatDate = (value:string) => new Intl.DateTimeFormat('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(value))
export default function Timeline({events,selectedId,onSelect,onAdd,onComment,loading,error,characterNames,backgroundNames}:Props) {
  return <section className="timeline-panel" aria-label="이야기 타임라인">
    <div className="section-heading"><div><p className="eyebrow">STORY FLOW</p><h2>타임라인</h2></div><button className="add-button" onClick={onAdd}>＋ 사건 추가</button></div>
    {loading ? <div className="state-card">이야기 장면을 불러오는 중이에요…</div> : error ? <div className="state-card error">{error}</div> : events.length === 0 ? <div className="state-card"><strong>첫 장면을 기록해 보세요.</strong><span>날짜와 시간을 입력하면 이야기 순서에 맞춰 자동으로 놓여요.</span><button className="text-button" onClick={onAdd}>사건 만들기</button></div> :
    <div className="timeline-list">{events.map((item,index)=><article className={'event-row '+(selectedId===item.id?'is-selected':'')} key={item.id}>
      <div className="timeline-track"><span className="event-dot">{index+1}</span></div>
      <div className="event-card-wrap"><button className="event-card" onClick={()=>onSelect(item)} aria-pressed={selectedId===item.id}>
        <time>{formatDate(item.happened_at)}</time><h3>{item.title}</h3><p>{item.description || '아직 남겨 둔 장면 설명이 없어요.'}</p>{item.character_ids.length > 0 && <span className="event-cast">등장 · {item.character_ids.map(id=>characterNames[id]).filter(Boolean).join(' · ')}</span>}{item.background_ids.length > 0 && <span className="event-background">배경 · {item.background_ids.map(id=>backgroundNames[id]).filter(Boolean).join(' · ')}</span>}<span className="card-action">자세히 보기 →</span>
      </button><button type="button" className="event-comment-button" onClick={()=>onComment(item)} aria-label={item.title+' 코멘트 열기'} title="사건 코멘트">🗪</button></div>
    </article>)}</div>}
  </section>
}
