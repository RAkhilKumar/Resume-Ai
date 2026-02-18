export function ScoreBar({score,size='md'}:{score:number;size?:'sm'|'md'}) {
  const color = score>=70?'bg-emerald-500':score>=45?'bg-amber-500':'bg-red-500'
  const h = size==='sm'?'h-1':'h-1.5'
  return <div className={`w-full bg-surface-800 rounded-full ${h}`}><div className={`${color} ${h} rounded-full transition-all duration-700`} style={{width:`${Math.min(score,100)}%`}}/></div>
}
