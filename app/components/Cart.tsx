'use client';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, Minus, Palette, Plus, ShoppingBag, X } from 'lucide-react';
import { money, offers, priceCart } from '@/lib/plans';
import type { Commerce } from './Commerce';

export function Cart({ commerce: c, signedIn, onAuth }: { commerce: Commerce; signedIn: boolean; onAuth: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  const total = c.items.length ? priceCart(c.items) : { amount: 0, credits: 0, consultations: 0 };
  return <dialog ref={ref} className="modal cart-modal" aria-label="Your reel cart" onCancel={() => c.setOpen(false)}>
    <div className="cart-heading"><div><span className="eyebrow">A LITTLE MORE CREATIVE ROOM</span><h2>Your <em>cart.</em></h2></div><button className="icon-button" aria-label="Close cart" onClick={() => c.setOpen(false)}><X /></button></div>
    {c.items.length ? <>
      <div className="cart-items">{c.items.map(item => {
        const p = offers.find(p => p.id === item.planId)!;
        const custom = p.kind === 'consultation';
        return <article key={p.id}>
          <div className={'cart-pack-icon' + (custom ? ' cart-pack-custom' : '')}>{custom ? <Palette size={23} /> : <ShoppingBag size={23} />}</div>
          <div><h3>{p.name}</h3><span>{custom ? 'One connection booking' : `${p.credits} reels`} · {money(p.amount)}</span>
            {custom && <p className="cart-design-note">₹99 is only the connection fee for a call or WhatsApp discussion. Your custom design is quoted and paid separately. No reel credits are included.</p>}
            <div className="quantity">
              {!custom && <><button aria-label={'Decrease ' + p.name} disabled={c.busy} onClick={() => c.update(item.quantity === 1 ? c.items.filter(i => i.planId !== p.id) : c.items.map(i => i.planId === p.id ? { ...i, quantity: i.quantity - 1 } : i))}><Minus size={13} /></button><b>{item.quantity}</b><button aria-label={'Increase ' + p.name} disabled={c.busy || item.quantity >= p.maxQuantity} onClick={() => c.update(c.items.map(i => i.planId === p.id ? { ...i, quantity: i.quantity + 1 } : i))}><Plus size={13} /></button></>}
              <button className="remove-pack" disabled={c.busy} aria-label={'Remove ' + p.name} onClick={() => c.update(c.items.filter(i => i.planId !== p.id))}>Remove</button>
            </div>
          </div><strong>{money(p.amount * item.quantity)}</strong>
        </article>;
      })}</div>
      <div className="cart-total"><span>{total.credits ? `${total.credits} reel credits` : 'Custom design connection'}{total.consultations > 0 && total.credits > 0 && <small>+ 1 custom design connection</small>}{total.consultations > 0 && <small>Design charges are additional</small>}</span><strong>{money(total.amount)}</strong></div>
      <div className="info-box">Your cart is saved for later. Cart checkout is opening soon. No payment, reel credits or design booking is confirmed by adding an item.</div>
      {!signedIn && <button className="button button-dark full-width" onClick={() => { c.setOpen(false); onAuth(); }}>Sign in to save this cart <ArrowUpRight size={17} /></button>}
      <button className="button button-outline full-width" disabled>Cart payments opening soon</button>
    </> : <div className="empty-state"><ShoppingBag size={38} /><h3>Room for more celebrations.</h3><p>Choose a reel pack or a Custom Designing conversation.</p></div>}
    <div className="cart-suggestions">{offers.filter(p => !c.items.some(i => i.planId === p.id)).map(p => <button disabled={c.busy} key={p.id} onClick={() => c.add(p.id)}><span>{p.name}<small>{p.kind === 'consultation' ? 'Connection fee only' : `${p.credits} reels`} · {money(p.amount)}</small></span><Plus size={18} /></button>)}</div>
  </dialog>;
}
