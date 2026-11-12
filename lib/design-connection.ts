export function designConnection(paymentLink?: string, contact?: string) {
  let paymentUrl: string | null = null;
  try {
    const url = new URL(paymentLink || '');
    if (url.protocol === 'https:' && !url.username && !url.password) paymentUrl = url.href;
  } catch {}
  const digits = (contact || '').replace(/[\s()+-]/g, '');
  const phone = /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
  const message = 'Hi Jashntoons, I would like to connect about Custom Designing. My ₹99 connection-fee payment reference is: [add reference]. My preferred call time or WhatsApp discussion preference is: [add details].';
  return {
    ready: !!paymentUrl && !!phone,
    paymentUrl,
    phone,
    whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null,
  };
}
