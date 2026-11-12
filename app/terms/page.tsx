import {pageMetadata} from '@/lib/seo';
import type { Metadata } from 'next';
import InfoPage from '../components/InfoPage';
export const metadata: Metadata = pageMetadata('Terms of use | Jashntoons','Using the Jashntoons invitation studio, your content, free reels and optional reel packs.','/terms');

export default function TermsPage() {
  return <InfoPage title="Terms of use" intro="These terms describe using Jashntoons to create, edit and save personal invitation reels.">
    <h2>Your account and your content</h2>
    <p>Sign in to use the studio and keep access to your saved work. Use your own account and upload only photos, music, text and other content you have the right and permission to use. You retain your rights in the material you provide and permit Jashntoons and its service providers to process it to carry out your creation, storage and export requests.</p>
    <h2>Creating with AI</h2>
    <p>AI results can vary and may contain errors in appearance, spelling or detail. Review faces, names, event dates, venues and every scene before sharing. Generated content is not guaranteed to be unique or an exact likeness. Do not use the studio for deceptive impersonation, abusive or unlawful content, or unauthorized use of someone’s image.</p>
    <h2>Free reels and optional packs</h2>
    <p>Each new account starts with two free reel credits. The studio shows when a new generation or reel version uses a credit. Saved avatars can be reused, and editing or reopening saved work does not itself start another paid AI request. A new avatar uses 1 credit. A new Custom AI film uses 5 credits for a 10-second illustrated and animated scene. Custom audio is available with the Custom AI package and does not include lip-sync. Matching generated results are reused; changing audio, text or effects on the same paid project does not start another AI generation.</p>
    <p>Optional one-time packs are listed at ₹299 for 3 reels, ₹799 for 10 reels and ₹1,499 for 25 reels. Payment checkout is not active yet. Adding a pack to the cart does not charge you or add credits. The final price and purchase details will be shown before any future payment; no recurring subscription is created by using the cart.</p>
    <h2>Templates, downloads and sharing</h2>
    <p>Templates and sample reels demonstrate the available styles. Personalize your invitation and check the preview before export. You are responsible for the content and destination of reels you download and share. Keep a downloaded copy of an important finished invitation.</p>
    <h2>Availability and support</h2>
    <p>Generation depends on connected AI services and can be delayed or unavailable. We show errors and job status in the studio so you can retry or return to saved work. Features and available templates may change. For help with a failed generation, credits or account access, contact <a href="mailto:pabesto99@gmail.com">pabesto99@gmail.com</a>.</p>
    <h2>Privacy and updates</h2>
    <p>Read the <a href="/privacy">privacy policy</a> for details about Google sign-in, photo processing, storage and deletion requests. Updated terms will be posted here with the date of the change.</p>
  </InfoPage>;
}
