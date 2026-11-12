import type {Invite} from './templates';
import {momentCollections,momentStyles} from './moment-presets';
export {momentCollections,momentStyles};

export type AIMoment={presetId:string;styleId:string;direction?:string;motionPrompt?:string};
export const MOMENT_PROMPT_REVISION='moments-v1';
export const MOMENT_CREDITS=5;
export const MOMENT_SECONDS=10;
export const momentPresets=momentCollections.flatMap(c=>c.moments.map(m=>({...m,categoryId:c.id,category:c.name,setting:c.setting})));
export const getMoment=(id:string)=>momentPresets.find(m=>m.id===id);
export const getMomentStyle=(id:string)=>momentStyles.find(s=>s.id===id);
export const momentCollection=(category:string)=>momentCollections.find(c=>c.name===category)??momentCollections[0];
export function defaultMoment(category='Wedding'):AIMoment{return {presetId:momentCollection(category).moments[0].id,styleId:'watercolor'};}

export function momentPrompts(selection:AIMoment){
 const preset=getMoment(selection.presetId),style=getMomentStyle(selection.styleId);
 if(!preset||!style)throw new Error('Choose an available AI moment and visual style.');
 const detail=selection.direction?.trim();
 const action=selection.motionPrompt?.trim()||`One continuous 10-second shot. ${preset.action} ${preset.camera}${detail?' Personal detail: '+detail+'.':''}`;
 const motion=`${action} Preserve the exact identities, ages, outfits and visual style of the input frame. Natural articulated body movement, stable faces and hands. No new people, cuts, text or dialogue.`;
 if(motion.length>1000)throw new Error('Shorten the motion prompt so the full prompt stays under 1,000 characters.');
 const image=`Create the first frame of a premium vertical 9:16 invitation film for ${preset.category}. Visual style: ${style.prompt} Setting: ${preset.setting} Prepare a believable starting pose and the props for this action: ${selection.motionPrompt?.trim()||preset.action} Show the people BEFORE the action, not a collage of its stages. ${detail?'Personal details: '+detail+'.':''} Use ONLY the people or characters in the uploaded reference photos. Preserve their recognisable facial features, skin tone, age, distinctive hair, facial hair, clothing colours and accessories unless the personal details request a change. Preserve illustrated character identity when the reference is an illustration. Keep the actual number of people; adapt a partner action to a solo gesture if only one person is supplied. Full bodies and hands visible, grounded in the scene, consistent scale and anatomy. Keep infants supported, without adult gestures. Leave the upper 20 percent calm for editable event details. No text, lettering, logos, watermarks or stock example faces.`;
 return {image,motion,action,preset,style};
}

// Choosing another shot leaves every earlier paid result in the account library.
// Clear the draft's old result so a new selection cannot masquerade as generated.
export function momentDraft(data:Invite,aiMoment:AIMoment):Invite{
 return {...data,aiMoment,creationTier:'custom',duration:MOMENT_SECONDS,generationMode:'scene',avatarMode:'scene',aiMotion:true,
  stockAvatarId:undefined,generatedArt:undefined,generatedVideo:undefined,generationJobId:undefined,pendingGenerationId:undefined,
  scenes:['opening','closing']};
}
