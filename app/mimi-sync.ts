import type {MimiProgress} from './mimi-progress';
import {supabase} from './supabase';

const env=(import.meta as ImportMeta & {env?:Record<string,string|undefined>}).env;
export const syncStatus=()=>env?.VITE_SUPABASE_URL&&env?.VITE_SUPABASE_PUBLISHABLE_KEY?'configured':'local';
export type CloudProfile=Pick<MimiProgress,'xp'|'hearts'|'streak'|'dailyXp'|'lastActive'|'completed'|'mastery'|'weak'>;
export const toCloudProfile=(progress:MimiProgress):CloudProfile=>({xp:progress.xp,hearts:progress.hearts,streak:progress.streak,dailyXp:progress.dailyXp,lastActive:progress.lastActive,completed:progress.completed,mastery:progress.mastery,weak:progress.weak});

type ProgressRow={xp:number;hearts:number;streak:number;daily_xp:number;last_active:string;completed_lessons:unknown;mastery:unknown;weak_topics:unknown};
type HeartStatus={hearts:number;unlimited_hearts_until:string|null};
type LearningResult={xp:number;hearts:number;daily_xp:number;completed_lessons:unknown;mastery:unknown;unlimited_hearts_until:string|null;awarded_xp:number};
const asRecord=(value:unknown):Record<string,number>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,number>:{};
const asStrings=(value:unknown):string[]=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[];
export const fromCloudProgress=(row:ProgressRow,heartStatus?:HeartStatus):MimiProgress=>({xp:row.xp,hearts:heartStatus?.hearts??row.hearts,streak:row.streak,dailyXp:row.daily_xp,lastActive:new Date(`${row.last_active}T00:00:00`).toDateString(),completed:asStrings(row.completed_lessons),mastery:asRecord(row.mastery),weak:asStrings(row.weak_topics),unlimitedHeartsUntil:heartStatus?.unlimited_hearts_until??undefined});

export async function loadCloudProgress(userId:string){
 if(!supabase)return null;
 const {data:heartData,error:heartError}=await supabase.rpc('refresh_daily_hearts').single();
 if(heartError)throw heartError;
 const {data,error}=await supabase.from('learning_progress').select('xp, hearts, streak, daily_xp, last_active, completed_lessons, mastery, weak_topics').eq('user_id',userId).maybeSingle();
 if(error)throw error;
 return data?fromCloudProgress(data as ProgressRow,heartData as HeartStatus):null;
}

export async function recordLearningResult(result:{lessonId:string;activityId:string;activityKind:string;correct:boolean;answer?:unknown;concept?:string;isFinal:boolean;score?:number}){
 if(!supabase)throw new Error('Mimi is not connected.');
 const {data,error}=await supabase.rpc('record_learning_result',{p_lesson_id:result.lessonId,p_activity_id:result.activityId,p_activity_kind:result.activityKind,p_correct:result.correct,p_answer:result.answer??null,p_concept:result.concept??null,p_is_final:result.isFinal,p_score:result.score??null}).single();
 if(error)throw error;
 return data as LearningResult;
}

export const applyLearningResult=(current:MimiProgress,result:LearningResult):MimiProgress=>({...current,xp:result.xp,hearts:result.hearts,dailyXp:result.daily_xp,completed:asStrings(result.completed_lessons),mastery:asRecord(result.mastery),unlimitedHeartsUntil:result.unlimited_hearts_until??undefined});

export async function purchaseShopItem(sku:string){
 if(!supabase)throw new Error('Mimi is not connected.');
 const {data,error}=await supabase.rpc('purchase_shop_item',{p_sku:sku}).single();
 if(error)throw error;
 return data as {xp:number;hearts:number;item_quantity:number};
}

export async function startUnlimitedHeartsCheckout(){
 if(!supabase)throw new Error('Mimi is not connected.');
 const {data,error}=await supabase.functions.invoke('create-heart-pass-checkout',{body:{}});
 if(error)throw error;
 if(!data?.url)throw new Error('Checkout is not available yet.');
 return data.url as string;
}
