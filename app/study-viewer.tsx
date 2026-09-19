import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {Crosshair,RotateCcw,X,ZoomIn} from 'lucide-react';
import type {StudyOrgan} from './study-data';

interface Props{organ:StudyOrgan;stage?:boolean;showCaption?:boolean;showHotspots?:boolean;mode?:'study'|'identify'|'reveal';target?:string;onTargetSelect?:(id:string)=>void}

export default function StudyViewer({organ,stage=false,showCaption=stage,showHotspots=true,mode='study',target,onTargetSelect}:Props){
 const host=useRef<HTMLDivElement>(null),points=useRef<HTMLButtonElement[]>([]),rotatingRef=useRef(true);
 const [selected,setSelected]=useState<string|null>(null),[rotating,setRotating]=useState(true),[error,setError]=useState(false),[usedControls,setUsedControls]=useState(false);
 useEffect(()=>{setSelected(null);setError(false);setUsedControls(false);},[organ.id,mode,target]);
 useEffect(()=>{rotatingRef.current=rotating;},[rotating]);
 useEffect(()=>{
  const el=host.current;if(!el)return;let disposed=false,frame=0,model:T.Object3D|undefined;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.setSize(el.clientWidth,el.clientHeight);renderer.domElement.setAttribute('aria-label',`Interactive ${organ.name} study model. Drag to rotate and use the wheel or pinch gesture to zoom.`);el.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,el.clientWidth/el.clientHeight,.01,100),controls=new OrbitControls(camera,renderer.domElement),clock=new T.Clock(),pivot=new T.Group();
  camera.position.set(0,.25,stage?8.4:6);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=stage?5:3;controls.maxDistance=stage?14:9;controls.addEventListener('start',()=>setUsedControls(true));scene.add(new T.HemisphereLight(0xfff7ee,0x59616c,2));
  const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(3,4,5);scene.add(key);const rim=new T.DirectionalLight(new T.Color(organ.accent),1.5);rim.position.set(-3,2,-3);scene.add(rim);
  const plinth=new T.Mesh(new T.CylinderGeometry(2.1,2.25,.2,48),new T.MeshStandardMaterial({color:0xf3eee9,roughness:.8}));plinth.position.y=-2;scene.add(plinth);pivot.rotation.set(.05,-.25,0);scene.add(pivot);
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const placeModel=(next:T.Object3D)=>{model=next;const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=3.55/Math.max(size.x,size.y,size.z,.01);model.scale.setScalar(scale);model.position.copy(center.multiplyScalar(-scale));pivot.add(model);};
  // Bone and muscle activities are rendered from BodyParts3D by the caller.
  // This viewer stays for the repository's purpose-built organ GLB models.
  if(organ.model.startsWith('procedural-'))setError(true);
  else loader.load(organ.model,gltf=>{if(disposed)return;placeModel(gltf.scene);},undefined,()=>{if(!disposed)setError(true);});
  const observer=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(el);const projected=new T.Vector3();
  const draw=()=>{if(disposed)return;frame=requestAnimationFrame(draw);const delta=clock.getDelta();if(model&&rotatingRef.current)pivot.rotation.y+=delta*.32;controls.update();renderer.render(scene,camera);const w=el.clientWidth,h=el.clientHeight;organ.hotspots.forEach((hotspot,index)=>{const node=points.current[index];if(!node)return;projected.fromArray(hotspot.position);pivot.localToWorld(projected);projected.project(camera);const visible=projected.z>-1&&projected.z<1;node.style.transform=`translate(${(projected.x*.5+.5)*w}px,${(-projected.y*.5+.5)*h}px) translate(-50%,-50%)`;node.style.opacity=visible?'1':'0';node.style.pointerEvents=visible?'auto':'none';});};draw();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(item=>{if(item instanceof T.Mesh){item.geometry.dispose();const materials=Array.isArray(item.material)?item.material:[item.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[organ,stage]);
 const activeId=selected??(mode==='reveal'?target:null);const active=organ.hotspots.find(h=>h.id===activeId);
 const choose=(id:string)=>{setSelected(id);onTargetSelect?.(id)};
 return <div className={`study-viewer ${stage?'study-stage':''} study-mode-${mode}`} style={{'--study-accent':organ.accent} as React.CSSProperties}>
  <div ref={host} className="study-canvas"/>
  {showHotspots&&organ.hotspots.map((hotspot,index)=><button ref={node=>{if(node)points.current[index]=node;}} key={hotspot.id} className={`study-hotspot ${selected===hotspot.id?'selected':''} ${mode==='reveal'&&target===hotspot.id?'revealed':''}`} style={{'--hotspot':hotspot.color} as React.CSSProperties} onClick={()=>choose(hotspot.id)} aria-label={`Select ${hotspot.label}`}><Crosshair size={stage?17:13}/></button>)}
  {!usedControls&&mode!=='study'&&<div className="study-gesture-hint"><ZoomIn size={15}/> Drag to rotate · scroll to zoom</div>}
  <div className="study-viewer-controls"><button onClick={()=>setRotating(value=>!value)} aria-pressed={rotating}>{rotating?'Pause rotation':'Rotate model'}</button><button onClick={()=>{setSelected(null);setRotating(false);}}><RotateCcw size={14}/> Reset</button></div>
  {showCaption&&<div className="study-stage-caption"><span>DETAILED ORGAN MODEL</span><strong>{organ.name}</strong><small>Tap a marker to study a structure</small></div>}
  {active&&<div className="study-callout"><button onClick={()=>setSelected(null)} aria-label="Close structure detail"><X size={13}/></button><strong>{active.label}</strong><span>{mode==='identify'&&selected?`Selected: ${active.detail}`:active.detail}</span></div>}
  {error&&<div className="study-load-error"><strong>3D model unavailable</strong><span>Use the accessible landmark list to continue this activity.</span><div>{organ.hotspots.map(h=><button key={h.id} onClick={()=>choose(h.id)}>{h.label}</button>)}</div></div>}
 </div>;
}
