'use client';
import { ArrowUpRight, Baby, Cake, Check, Flower2, Heart, House, PartyPopper } from 'lucide-react';
import { getTemplate, type Template } from '@/lib/templates';

export {AIWorkflow as HomepageHow} from './AIWorkflow';

type Create = (template: Template) => void;

export {CinematicHero as HomepageHero} from './CinematicHero';

const occasionChoices = [
  { name: 'Wedding', label: 'Weddings', icon: Heart, image:'/studio/scenes-photo/wedding.webp', avatar:'/studio/avatars-photo/wedding-01.webp', note:'A love worth celebrating' },
  { name: 'Birthday', label: 'Birthdays', icon: Cake, image:'/studio/scenes-photo/birthday.webp', avatar:'/studio/avatars-photo/birthday-02.webp', note:'Make their day a little magic' },
  { name: 'Baby shower', label: 'Baby showers', icon: Baby, image:'/studio/scenes-photo/baby-shower.webp', avatar:'/studio/avatars-photo/baby-shower-01.webp', note:'For your next little adventure' },
  { name: 'Engagement', label: 'Engagements', icon: Flower2, image:'/studio/scenes-photo/engagement.webp', avatar:'/studio/avatars-photo/engagement-01.webp', note:'The beginning of forever' },
  { name: 'Housewarming', label: 'New homes', icon: House, image:'/studio/scenes-photo/housewarming.webp', avatar:'/studio/avatars-photo/housewarming-01.webp', note:'New keys. New memories.' },
  { name: 'All occasions', label: 'Every celebration', icon: PartyPopper, image:'/studio/scenes-photo/festivals.webp', avatar:'/studio/avatars-photo/festivals-01.webp', note:'Find your reason to celebrate' },
];
export function HomepageOccasions({ select }: { select: (category: string) => void }) {

  return <section className="occasion-collection home-occasion-edit" id="occasions" aria-labelledby="occasion-heading">
    <div className="occasion-collection__heading">
      <div><span className="home-eyebrow">FIND YOUR OCCASION</span><h2 id="occasion-heading">Life has so many<br/><em>opening scenes.</em></h2></div>
      <p>A wedding, a first birthday, a new beginning.<br/>Choose the occasion. Find the right feeling.</p>
    </div>
    <div className="occasion-collection__grid">{occasionChoices.map(({name,label,icon:Icon,image,avatar,note},i)=><button className="occasion-collection__card" key={name} onClick={()=>select(name)} aria-label={'Explore '+label.toLowerCase()}>
      <div className="occasion-collection__picture"><img src={image} alt="" width={720} height={1280} loading="lazy"/><img className="occasion-collection__character" src={avatar} alt="" width={720} height={1280} loading="lazy"/><span className="occasion-collection__index" aria-hidden="true">0{i+1}</span><span className="occasion-collection__arrow" aria-hidden="true"><ArrowUpRight size={19}/></span></div>
      <span className="occasion-collection__title"><Icon size={17} strokeWidth={1.4} aria-hidden="true"/><span>{label}</span></span><small>{note}</small>
    </button>)}</div>
  </section>;
}

export function HomepageTemplateArt({ template: t }: { template: Template }) {
  const src = t.poster ?? (t.catalog ? `/catalog/${t.id}.webp` : t.world ? `/worlds/${t.world}.webp` : `/cinema/${t.art}.webp`);
  return <div className="home-template-art"><img src={src} alt={t.mood} width={720} height={1280} loading="lazy" /><span className="home-template-category">{t.category}</span><div className="home-template-sample"><small>{t.label}</small><strong>{t.name}</strong></div><span className="home-template-edit">Make it yours <ArrowUpRight size={16} /></span></div>;
}

export function HomepageClosing({ create }: { create: Create }) {
  return <section className="home-finale"><div className="home-finale-copy"><span className="home-workbench-kicker">THE NEXT STORY IS YOURS</span><h2>Some moments<br/>deserve <em>a little movie.</em></h2><p>Give your celebration its opening scene.</p><button className="atelier-primary" onClick={() => create(getTemplate('reference-shaadi-haveli'))}>Create your invitation <ArrowUpRight size={19} /></button><span className="home-finale-note"><Check size={14} /> Your photos and drafts stay saved to your account.</span></div><div className="home-finale-art" aria-hidden="true"><span className="home-finale-ring"/><div className="home-finale-frame home-finale-frame-one"><img src="/reference-films/royal-doors.webp" alt="" width={540} height={960} loading="lazy"/></div><div className="home-finale-frame home-finale-frame-two"><img src="/reference-films/shaadi-haveli.webp" alt="" width={540} height={960} loading="lazy"/></div><span className="home-finale-art-note">A NEW CHAPTER / MADE PERSONAL</span></div></section>;
}
