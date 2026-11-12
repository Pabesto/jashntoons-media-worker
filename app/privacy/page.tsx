import {pageMetadata} from '@/lib/seo';
import type { Metadata } from 'next';
import InfoPage from '../components/InfoPage';
export const metadata: Metadata = pageMetadata('Privacy policy | Jashntoons','How Jashntoons uses Google sign-in details, uploaded photos, AI creations and saved invitation reels.','/privacy');

export default function PrivacyPage() {
  return <InfoPage title="Privacy policy" intro="This page explains what Jashntoons uses to create your invitation reels and keep your work in your account.">
    <h2>Information you share</h2>
    <ul><li><strong>Account details:</strong> Google provides your verified email, name and Google account identifier when you sign in. We use these to identify your account and keep your projects together. Jashntoons does not receive your Google password or request access to your Gmail messages, contacts, calendar or Drive.</li><li><strong>Creative content:</strong> the photos and optional voice or music clips you upload, event names, dates, venues, messages, prompts, scene settings, generated avatars and exported reels.</li><li><strong>Service records:</strong> saved projects, generation status, credit usage, cart selections and essential sign-in and request records.</li></ul>
    <h2>How your information is used</h2>
    <p>We use account information to sign you in, protect access to your work and respond to account questions. We store your creative content so you can generate invitations, edit them and return to saved projects. Generation and credit records help us resume jobs, reuse existing results and avoid charging a reel credit twice for the same operation.</p>
    <h2>AI generation and service providers</h2>
    <p>When you request an AI avatar or animation, the selected reference photos and creative instructions are sent to the studio’s configured AI service. Runway currently provides this processing. Saving a photo alone does not start a paid AI generation. Your Google email and name are not included in the creative prompt. Your own soundtrack is stored privately and mixed into your export in the browser; it is not sent to the image or animation provider.</p>
    <p>Google processes sign-in. Our hosting and storage services process the records and files needed to operate Jashntoons. AI processing is also subject to the provider’s policies. You can read <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google’s privacy policy</a> and <a href="https://runwayml.com/privacy-policy" target="_blank" rel="noreferrer">Runway’s privacy policy</a>.</p>
    <p>Jashntoons uses Google sign-in information for account functionality, not for advertising or AI model training. Uploaded photos and saved projects are not automatically published in the template gallery. You choose where to share downloaded reels.</p>
    <h2>Public creator bundles</h2>
    <p>Publishing is optional. When you confirm public sharing, your selected original photos, complete exported reels, public creator name, title and caption appear in Creator Reels on the homepage and through a shareable link. Anyone can view them, including details or voices already present in the video. Your account email and unselected uploads are not included. Community likes are stored against signed-in accounts and shown only as totals. You can hide a bundle from My reels; its public links stop serving the files. Hiding cannot remove copies someone has already downloaded or recorded.</p>
    <h2>Voice cloning and speaking characters</h2>
    <p>When you choose Save &amp; clone voice, your voice sample is sent to Runway to create a reusable custom voice. When you request a speaking scene, your dialogue, chosen character portrait and generated speech are processed by Runway voice and avatar services to produce lip-synchronised video. This is separate from uploading a background soundtrack. Only clone your own voice or a voice you have permission to use.</p>
    <p>Your voice sample, provider voice identifier, generated speech and speaking clips are saved with your account so you can reuse them. They are not displayed in the public gallery. Voice cloning and new speaking scenes require the credit confirmation shown in the editor. For deletion of saved voices and associated provider assets, contact us using the account-data request address below.</p>
    <h2>Saved work, cookies and your device</h2>
    <p>Essential secure cookies maintain your sign-in session and protect the Google login process. Browser storage keeps draft recovery data and studio preferences. Drafts and generated files are associated with your signed-in account. Sign out on shared devices, and keep downloaded copies somewhere you trust.</p>
    <h2>Retention and deletion</h2>
    <p>We keep saved content so you can return to it and reuse generated assets. You can delete an invitation draft in My reels. Deleting a draft does not automatically remove separate photos, avatars, exported files or credit records. For account, photo or generated-file deletion requests, contact <a href="mailto:pabesto99@gmail.com?subject=Jashntoons%20data%20request">pabesto99@gmail.com</a> from your account email. We may need to verify that the request belongs to you. Removing Jashntoons from your Google account’s connected apps stops future Google authorization; it does not by itself delete saved Jashntoons content.</p>
    <h2>Photos of other people</h2>
    <p>Upload photos only when you have permission to use them. A parent or guardian should manage uploads involving children. Avoid adding identity documents, payment information or other details that are not needed for your invitation.</p>
    <h2>Questions and updates</h2>
    <p>Contact Jashntoons at <a href="mailto:pabesto99@gmail.com">pabesto99@gmail.com</a> for privacy questions or account-data requests. Changes to how the studio handles your information will be reflected on this page with an updated date.</p>
  </InfoPage>;
}
