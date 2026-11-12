import {brandSchema,jsonLd} from '@/lib/seo';
import Jashntoons from './components/Jashntoons';
export default function Home(){return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(brandSchema)}}/><Jashntoons/></>;}
