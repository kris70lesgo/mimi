import type {StudyId} from './study-data';

export type Difficulty='foundation'|'preclinical'|'clinical';
export type ActivityBase={id:string;prompt:string;explanation:string;learningObjective:string;difficulty:Difficulty;references:string[];concept?:string};

export type McqActivity=ActivityBase&{kind:'mcq';options:string[];answer:number};
export type IdentifyHotspotActivity=ActivityBase&{kind:'identify-hotspot';organ:StudyId;target:string;hint:string};
export type TypeLabelActivity=ActivityBase&{kind:'type-label';organ:StudyId;target:string;accepted:string[];hint:string};
export type FunctionFromModelActivity=ActivityBase&{kind:'function-from-model';organ:StudyId;target:string;options:string[];answer:number};
export type SequenceFlowActivity=ActivityBase&{kind:'sequence-flow';steps:{id:string;label:string}[];answer:string[]};
export type CaseApplicationActivity=ActivityBase&{kind:'case-application';organ:StudyId;options:string[];answer:number;target?:string};

export type Activity=McqActivity|IdentifyHotspotActivity|TypeLabelActivity|FunctionFromModelActivity|SequenceFlowActivity|CaseApplicationActivity;
export type Lesson={id:string;title:string;subtitle:string;icon:string;activities:Activity[]};
export type Unit={id:string;title:string;description:string;color:string;lessons:Lesson[]};
export type ActivityAnswer={value:string|number|string[];target?:string};

export function normalizeAnatomyLabel(value:string){return value.trim().toLowerCase().replace(/[.,]/g,'').replace(/\s+/g,' ');}

export function isActivityCorrect(activity:Activity,answer:ActivityAnswer|undefined){
 if(!answer)return false;
 if(activity.kind==='identify-hotspot')return answer.target===activity.target;
 if(activity.kind==='type-label')return typeof answer.value==='string'&&activity.accepted.map(normalizeAnatomyLabel).includes(normalizeAnatomyLabel(answer.value));
 if(activity.kind==='sequence-flow')return Array.isArray(answer.value)&&answer.value.join('|')===activity.answer.join('|');
 return typeof answer.value==='number'&&answer.value===activity.answer;
}
