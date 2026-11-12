const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
function source(file) { const out = {}; const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; new Function('exports', js)(out); return out; }
const { priceCart, plans, customPlan, perReel } = source('lib/plans.ts');
const { designConnection } = source('lib/design-connection.ts');

test('custom booking is ₹99, grants zero reel credits and cannot be duplicated', () => {
  assert.deepEqual(priceCart([{ planId: customPlan.id, quantity: 1 }]), { amount: 9900, credits: 0, consultations: 1, currency: 'INR' });
  assert.throws(() => priceCart([{ planId: customPlan.id, quantity: 2 }]));
  assert.throws(() => priceCart([{ planId: customPlan.id, quantity: 1 }, { planId: customPlan.id, quantity: 1 }]));
});
test('all three existing packs and a connection can coexist without changing pack prices', () => {
  assert.deepEqual(priceCart([...plans, customPlan].map(p => ({ planId: p.id, quantity: 1 }))), { amount: 269600, credits: 38, consultations: 1, currency: 'INR' });
  assert.deepEqual(plans.map(p => perReel(p.amount, p.credits)), ['₹99.67', '₹79.90', '₹59.96']);
  for (const quantity of [0, -1, 1.5, 6, NaN]) assert.throws(() => priceCart([{ planId: plans[0].id, quantity }]));
  assert.throws(() => priceCart([{ planId: 'unknown', quantity: 1 }]));
});
test('booking links only activate with a valid public HTTPS link and contact number', () => {
  assert.equal(designConnection().ready, false);
  assert.equal(designConnection('javascript:alert(1)', '+91 99999 99999').ready, false);
  assert.equal(designConnection('https://example.test/payment', 'missing').ready, false);
  assert.equal(designConnection('https://user:secret@example.test/payment', '+91 99999 99999').ready, false);
  const result = designConnection('https://example.test/payment', '+91 99999 99999');
  assert.equal(result.ready, true);
  assert.equal(result.phone, '919999999999');
  assert.ok(result.whatsappUrl.startsWith('https://wa.me/919999999999?text='));
});
