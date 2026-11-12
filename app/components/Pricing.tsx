'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, Clapperboard, Flower2, Layers3, MessageCircle, Palette, Phone, ShoppingBag, Sparkles, X } from 'lucide-react';
import { customPlan, money, perReel, plans } from '@/lib/plans';
import type { designConnection } from '@/lib/design-connection';
import type { Commerce } from './Commerce';

type Connection = ReturnType<typeof designConnection>;
const icons = [Flower2, Layers3, Clapperboard];

export function Pricing({ commerce: c }: { commerce: Commerce }) {
  const [customOpen, setCustomOpen] = useState(false);
  return <section className="jashn-packages" id="reel-packs" aria-labelledby="packages-title">
    <div className="packages-heading">
      <div><span className="eyebrow">A LITTLE PLAN FOR EVERY BIG MOMENT</span><h2 id="packages-title">Your celebration.<br /><em>Your kind of package.</em></h2></div>
      <div className="packages-intro"><p>Make it yourself with a reel pack, or create something personal with our design team.</p><a href="#package-differences">Find your fit <ArrowDown size={15} aria-hidden="true" /></a></div>
    </div>
    <div className="packages-free"><Sparkles size={18} aria-hidden="true" /><span><strong>Your first 2 reels are on us.</strong> Explore the studio before choosing a pack.</span><span className="packages-one-time">One-time packs · No subscription</span></div>
    <div className="packages-grid">
      {plans.map((plan, i) => {
        const Icon = icons[i];
        return <article className={`package-card package-tone-${i}`} key={plan.id} aria-labelledby={`package-${plan.id}`}>
          <div className="package-card-top"><span className="package-icon"><Icon size={23} strokeWidth={1.4} aria-hidden="true" /></span><span>{plan.tag}</span><span className="package-number">0{i + 1}</span></div>
          <h3 id={`package-${plan.id}`}>{plan.name}</h3><p className="package-description">{plan.description}</p>
          <div className="package-price"><strong>{money(plan.amount)}</strong><span>one-time pack</span></div>
          <div className="package-credit-line"><span><b>{plan.credits}</b> reel credits</span><span>{perReel(plan.amount, plan.credits)} / reel</span></div>
          <p className="package-best"><span>YOUR PERFECT FIT</span>{plan.bestFor}</p>
          <ul><li><Check size={15} aria-hidden="true" />Personalise templates yourself</li><li><Check size={15} aria-hidden="true" />Your photos, names & event details</li><li><Check size={15} aria-hidden="true" />Custom AI: 5 credits / 10-second film</li><li><Check size={15} aria-hidden="true" />Full HD exports · Free re-downloads</li></ul>
          <button className="button package-add" disabled={c.busy} onClick={() => c.add(plan.id)} aria-label={`Add ${plan.name} to cart`}>Choose {plan.name}<ArrowUpRight size={17} aria-hidden="true" /></button>
        </article>;
      })}
    </div>
    <article className="custom-package" aria-labelledby="custom-package-title">
      <div className="custom-art" aria-hidden="true"><div className="custom-art-card"><span>A LITTLE BRIEF.<br />A BIG IDEA.</span><Flower2 strokeWidth={.8} /><i>made<br />for you.</i><small>THE CUSTOM COLLECTION</small></div><span className="custom-art-seal"><Palette size={19} />YOUR<br />VISION</span></div>
      <div className="custom-package-copy"><span className="eyebrow">04 / A DESIGN THAT STARTS WITH YOU</span><h3 id="custom-package-title">Custom <em>Designing</em></h3><p>Have something completely your own in mind? Connect one-to-one over a call or WhatsApp. Share your story, references and ideas, and we’ll plan your custom design together.</p><div className="custom-contact-options"><span><Phone size={15} aria-hidden="true" />One-to-one call</span><span><MessageCircle size={15} aria-hidden="true" />WhatsApp discussion</span></div><p className="custom-quote"><strong>No fixed design price.</strong> The final quote depends on your design requirements, scope and complexity. Design work is paid separately after you agree to the quote.</p></div>
      <div className="custom-booking"><span className="custom-fee-label">START WITH A CONVERSATION</span><div><strong>{money(customPlan.amount)}</strong><span>one-time<br />connection fee</span></div><p>For connecting with our team.<br /><b>This is not the design price.</b></p><button className="button" onClick={() => setCustomOpen(true)}>Connect for ₹99 <ArrowUpRight size={18} aria-hidden="true" /></button><small>Custom design payment is additional.</small></div>
    </article>
    <div className="custom-process" aria-label="How Custom Designing works"><div><b>01</b><span><strong>Pay ₹99 to connect</strong>Book your design conversation.</span></div><div><b>02</b><span><strong>Talk through your idea</strong>On a one-to-one call or WhatsApp.</span></div><div><b>03</b><span><strong>Approve your custom quote</strong>Design charges are paid separately.</span></div></div>
    <div className="package-comparison" id="package-differences"><div className="comparison-heading"><div><span className="eyebrow">A CLEARER WAY TO CHOOSE</span><h3>What’s the <em>difference?</em></h3></div><p>Standard template reels use 1 credit. A new Custom AI film uses 5 credits for 10 seconds, including artwork, movement and your own audio.</p></div><div className="comparison-scroll" role="region" aria-label="Compare packages; scroll horizontally on smaller screens" tabIndex={0}><table><caption className="sr-only">Reel packs compared with the Custom Designing connection booking</caption><thead><tr><th scope="col">Your package includes</th>{plans.map(p => <th scope="col" key={p.id}>{p.name}</th>)}<th scope="col">Custom Designing</th></tr></thead><tbody><tr><th scope="row">Reel credits</th>{plans.map(p => <td key={p.id}>{p.credits} credits</td>)}<td>Quoted for your project</td></tr><tr><th scope="row">Price</th>{plans.map(p => <td key={p.id}>{money(p.amount)} one-time</td>)}<td>₹99 connection fee<br /><small>+ separate design payment</small></td></tr><tr><th scope="row">Price per reel</th>{plans.map(p => <td key={p.id}>{perReel(p.amount, p.credits)}</td>)}<td>Based on your design</td></tr><tr><th scope="row">How it’s made</th>{plans.map(p => <td key={p.id}>You edit a template</td>)}<td>Planned with our team</td></tr><tr><th scope="row">One-to-one design discussion</th>{plans.map(p => <td key={p.id}>Not included</td>)}<td>Call or WhatsApp</td></tr><tr><th scope="row">Best for</th>{plans.map(p => <td key={p.id}>{p.bestFor}</td>)}<td>A specific design idea or personal brief</td></tr></tbody></table></div><p className="comparison-mobile-hint">Swipe the table to compare every package <ArrowUpRight size={13} aria-hidden="true" /></p></div>
    <p className="packages-availability"><a href="#custom-ai-package">Own audio & fully generated video: explore the Custom AI package.</a><br/>Reel-pack checkout is opening soon. Adding a pack to your cart does not charge you or add credits. Custom connection availability is shown before booking.</p>
    {customOpen && <CustomConnection commerce={c} onClose={() => setCustomOpen(false)} />}
  </section>;
}

function CustomConnection({ commerce: c, onClose }: { commerce: Commerce; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const controller = new AbortController();
    fetch('/api/design-connection', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Unavailable');
      setConnection(await response.json() as Connection);
    }).catch(error => { if (error.name !== 'AbortError') setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); dialog?.close(); };
  }, []);
  return <dialog ref={ref} className="modal custom-connection-modal" aria-labelledby="connection-title" onCancel={onClose}>
    <button className="icon-button custom-modal-close" aria-label="Close design connection" onClick={onClose}><X /></button>
    <span className="eyebrow">LET’S MAKE IT PERSONAL</span><h2 id="connection-title">Your custom design<br />starts with a <em>conversation.</em></h2>
    <div className="connection-cost"><span>One-time connection fee<strong>₹99</strong></span><p>One-to-one call or WhatsApp discussion.<br /><b>Design work is not included in ₹99.</b></p></div>
    <p>Share your ideas, event details and references. We’ll discuss what you need and give you a separate quote based on the design. You approve the quote before paying for the design work.</p>
    {loading ? <p role="status">Checking booking availability…</p> : connection?.ready ? <div className="connection-actions"><a className="button" href={connection.paymentUrl!} target="_blank" rel="noopener noreferrer">Pay ₹99 connection fee <ArrowUpRight size={17} /></a><p>After paying, send your receipt and preferred call time on WhatsApp. Our team will verify the payment and confirm your conversation.</p><a className="button button-outline" href={connection.whatsappUrl!} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} />Share receipt on WhatsApp</a><a className="connection-phone" href={`tel:+${connection.phone}`}><Phone size={14} />Call +{connection.phone}</a></div> : <div className="connection-actions"><p className="connection-status" role="status">{failed ? 'Booking availability could not be checked. Please close and try again.' : 'Connection bookings are opening soon. Save the ₹99 fee in your cart for later; no payment or booking is confirmed yet.'}</p><button className="button" disabled={c.busy} onClick={() => { onClose(); void c.add(customPlan.id); }}><ShoppingBag size={17} />Save ₹99 connection to cart</button></div>}
    <small className="connection-fine-print">The ₹99 connection fee and the final custom design payment are separate. Reel credits are not included with this booking.</small>
  </dialog>;
}
