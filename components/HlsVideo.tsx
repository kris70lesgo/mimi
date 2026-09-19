'use client';

import Hls from 'hls.js';
import {useEffect,useRef} from 'react';

export default function HlsVideo({src,className}:{src:string;className?:string}){
 const ref=useRef<HTMLVideoElement>(null);
 const playbackId=src.split('/').at(-1)?.replace('.m3u8','');
 const poster=playbackId?`https://image.mux.com/${playbackId}/thumbnail.jpg?time=1&width=1200`:undefined;
 useEffect(()=>{const video=ref.current;if(!video)return;let retry:number|undefined;let inView=true;const start=()=>{if(!inView)return;video.play().catch(()=>{retry=window.setTimeout(start,750)})};const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)start();else video.pause()},{rootMargin:'200px'});observer.observe(video);video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.addEventListener('loadeddata',start);video.addEventListener('canplay',start);if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=src;video.load();return()=>{observer.disconnect();video.removeEventListener('loadeddata',start);video.removeEventListener('canplay',start);if(retry)window.clearTimeout(retry)}}if(!Hls.isSupported())return;const hls=new Hls({autoStartLoad:true,capLevelToPlayerSize:false,startLevel:-1,maxBufferLength:60,maxMaxBufferLength:120,abrEwmaDefaultEstimate:50000000});hls.loadSource(src);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,()=>{hls.currentLevel=hls.levels.length-1;hls.startLoad(-1);start()});hls.on(Hls.Events.LEVEL_LOADED,start);return()=>{observer.disconnect();video.removeEventListener('loadeddata',start);video.removeEventListener('canplay',start);if(retry)window.clearTimeout(retry);hls.destroy()}},[src]);
 return <video ref={ref} className={className} poster={poster} autoPlay muted loop playsInline/>;
}
