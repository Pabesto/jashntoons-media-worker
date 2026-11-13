/** Lightweight vector effects; decorative only, never part of an invitation export. */
export function StudioEffects(){
 return <div className="studio-effects" aria-hidden="true">
  <span className="studio-halo"/>
  <svg className="studio-orbits" viewBox="0 0 400 400" fill="none" focusable="false">
   <circle cx="200" cy="200" r="172" stroke="currentColor" strokeOpacity=".28"/>
   <circle cx="200" cy="200" r="148" stroke="currentColor" strokeOpacity=".16" strokeDasharray="2 12"/>
   <path d="M28 200a172 172 0 0 1 172-172M372 200a172 172 0 0 1-172 172" stroke="currentColor" strokeWidth="2"/>
   <circle cx="200" cy="28" r="5" fill="currentColor"/>
   <circle cx="200" cy="372" r="4" fill="currentColor"/>
  </svg>
  {[0,1,2,3,4].map(i=><span className={'studio-spark studio-spark-'+i} key={i}/>)}
 </div>
}
