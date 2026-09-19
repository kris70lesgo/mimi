export type MimiSound='select'|'correct'|'incorrect'|'complete';

/** Clear, short original UI tones. They are intentionally optional. */
export function playMimiSound(kind:MimiSound,enabled=true){
 if(!enabled||typeof window==='undefined')return;
 const Audio=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Audio)return;
 const context=new Audio();const now=context.currentTime;const notes:Record<MimiSound,number[]>={select:[440],correct:[523.25,659.25,783.99],incorrect:[220,164.81],complete:[523.25,659.25,783.99,1046.5]};
 const levels:Record<MimiSound,number>={select:.11,correct:.24,incorrect:.21,complete:.27};
 notes[kind].forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();const start=now+index*(kind==='select'?0:.075);oscillator.type=kind==='incorrect'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(levels[kind],start);gain.gain.exponentialRampToValueAtTime(.001,start+.18);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+.2);});
 window.setTimeout(()=>context.close().catch(()=>undefined),650);
}
