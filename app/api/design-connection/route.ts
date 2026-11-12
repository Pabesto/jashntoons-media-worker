export const dynamic = 'force-dynamic';
import { env } from 'cloudflare:workers';
import { json } from '@/lib/api';
import { designConnection } from '@/lib/design-connection';

export function GET() {
  return json(designConnection(env.CUSTOM_DESIGN_PAYMENT_URL, env.CUSTOM_DESIGN_CONTACT_NUMBER));
}
