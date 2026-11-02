// Execute the actual Deno entrypoints and shared HMAC with fabricated data.
// Only Supabase/auth and provider HTTP are simulated. No environment files,
// credentials, network, PostgreSQL triggers or RLS are used by this suite.
/* global __dirname, jest, beforeEach, afterEach, expect, describe, it */
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHmac, webcrypto } = require('node:crypto');
const { TextEncoder, TextDecoder } = require('node:util');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../../../supabase/functions');
const SECRET = 'sec01-disposable-fixture-only';
const USER = 'fixture-owner';
const clone = (value) => JSON.parse(JSON.stringify(value));
const network = jest.fn(() => { throw new Error('Network disabled'); });

class FixtureDB {
  constructor(tables = {}) {
    this.tables = clone(tables);
    this.writes = [];
    this.beforeUpdate = null;
    this.failRead = null;
  }
  from(table) { return new Query(this, table); }
  async rpc(name, params) {
    if (name === 'activate_premium_subscription') {
      this.premiumRpcCalls = (this.premiumRpcCalls ?? 0) + 1;
      if (this.beforeUpdate) {
        const hook = this.beforeUpdate; this.beforeUpdate = null; hook({ table: 'premium_subscriptions' });
      }
      if (this.settlementFailure) return { data: null, error: new Error('Fixture transaction failure') };
      const sub = this.tables.premium_subscriptions.find((row) => row.id === params.p_subscription_id);
      const alreadyActive = sub?.status === 'active';
      if (!sub || sub.user_id !== params.p_user_id || sub.razorpay_order_id !== params.p_provider_order_id ||
        !sub.plan_id || sub.plan_id !== params.p_plan_id || !this.tables.premium_plans?.some((p) => p.id === sub.plan_id) ||
        sub.billing_cycle !== params.p_billing_cycle || !['monthly', 'yearly'].includes(sub.billing_cycle) ||
        Math.round((Number(sub.price) + Math.round(Number(sub.price) * 0.18 * 100) / 100) * 100) !== params.p_amount_paise ||
        params.p_currency !== 'INR' ||
        (alreadyActive ? sub.razorpay_payment_id !== params.p_payment_id ||
          !Number.isFinite(Date.parse(sub.started_at)) || !Number.isFinite(Date.parse(sub.current_period_end)) ||
          Date.parse(sub.current_period_end) <= Date.parse(sub.started_at) :
          !['pending', 'expired'].includes(sub.status) || sub.started_at != null || sub.current_period_end != null)) {
        return { data: null, error: new Error('Fixture premium expectations mismatch') };
      }
      if (!alreadyActive) {
        const start = new Date(); const end = new Date(start);
        if (sub.billing_cycle === 'yearly') end.setUTCFullYear(end.getUTCFullYear() + 1);
        else end.setUTCMonth(end.getUTCMonth() + 1);
        Object.assign(sub, { status: 'active', razorpay_payment_id: params.p_payment_id,
          started_at: start.toISOString(), current_period_end: end.toISOString(), payment_method: 'Razorpay' });
        this.writes.push({ table: 'premium_subscriptions', op: 'update' });
      }
      const data = { subscription: clone(sub), alreadyActive };
      return { data: this.premiumReply ? this.premiumReply(data) : data, error: null };
    }
    if (name === 'settle_project_purchase') {
      this.purchaseRpcCalls = (this.purchaseRpcCalls ?? 0) + 1;
      if (this.beforeUpdate) {
        const hook = this.beforeUpdate; this.beforeUpdate = null; hook({ table: 'purchases' });
      }
      if (this.settlementFailure) return { data: null, error: new Error('Fixture transaction failure') };
      const purchase = this.tables.purchases.find((row) => row.id === params.p_purchase_id);
      if (!purchase || purchase.user_id !== params.p_user_id || purchase.razorpay_order_id !== params.p_provider_order_id ||
        Number(purchase.total_amount) * 100 !== params.p_amount_paise || params.p_currency !== 'INR' ||
        !['pending', 'failed', 'success'].includes(purchase.status) ||
        (purchase.status === 'success' && purchase.razorpay_payment_id !== params.p_payment_id)) {
        return { data: null, error: new Error('Fixture purchase expectations mismatch') };
      }
      const alreadySettled = purchase.status === 'success';
      if (!alreadySettled) {
        if (this.debitFailure || this.salesFailure) return { data: null, error: new Error('Fixture atomic side effect failure') };
        Object.assign(purchase, { status: 'success', razorpay_payment_id: params.p_payment_id, failure_reason: null });
        (this.tables.wallet_transactions ??= []).push({ purchase_id: purchase.id, user_id: purchase.user_id,
          type: 'debit', category: 'project_purchase', amount: Number(purchase.total_amount) });
        this.writes.push({ table: 'purchases', op: 'update' }, { table: 'wallet_transactions', op: 'insert' }, { table: 'sales' });
      }
      const result = { purchase: clone(purchase), alreadySettled };
      return { data: this.malformedPurchaseReply ? { ...result, purchase: null } : result, error: null };
    }
    if (name === 'settle_wallet_topup') {
      if (this.beforeUpdate) {
        const hook = this.beforeUpdate; this.beforeUpdate = null; hook({ table: 'wallet_topup_orders' });
      }
      if (this.settlementFailure) return { data: null, error: new Error('Fixture transaction failure') };
      const order = this.tables.wallet_topup_orders.find((row) => row.id === params.p_order_id);
      const credits = this.tables.wallet_transactions ??= [];
      const credit = credits.find((row) => row.topup_order_id === params.p_order_id);
      if (!order || order.user_id !== params.p_user_id || order.razorpay_order_id !== params.p_provider_order_id ||
        Number(order.amount) * 100 !== params.p_amount_paise || order.currency !== params.p_currency ||
        (order.status === 'paid' && (order.razorpay_payment_id !== params.p_payment_id || !credit ||
          credit.user_id !== order.user_id || credit.amount !== Number(order.amount) ||
          credit.type !== 'credit' || credit.category !== 'added_money')) ||
        (order.status !== 'paid' && credit)) {
        return { data: null, error: new Error('Fixture settlement expectations mismatch') };
      }
      const alreadySettled = order.status === 'paid';
      if (!alreadySettled) {
        if (this.creditFailure) return { data: null, error: new Error('Fixture ledger insertion failure') };
        order.status = 'paid'; order.razorpay_payment_id = params.p_payment_id;
        credits.push({ topup_order_id: order.id, user_id: order.user_id, type: 'credit', category: 'added_money', amount: Number(order.amount) });
        this.writes.push({ table: 'wallet_topup_orders', op: 'update' }, { table: 'wallet_transactions', op: 'insert' });
      }
      return { data: { amount: Number(order.amount), alreadySettled }, error: null };
    }
    if (name === 'increment_project_sales_count') this.writes.push({ table: 'sales' });
    return { data: name === 'custom_project_amounts' ? { due: 90 } : true, error: null };
  }
}

class Query {
  constructor(db, table) {
    this.db = db; this.table = table; this.filters = []; this.op = 'read';
  }
  select() { return this; }
  returns() { return this; }
  eq(key, value) { this.filters.push((row) => row[key] === value); return this; }
  neq(key, value) { this.filters.push((row) => row[key] != null && row[key] !== value); return this; }
  is(key, value) { this.filters.push((row) => (row[key] ?? null) === value); return this; }
  in(key, values) { this.filters.push((row) => values.includes(row[key])); return this; }
  gt(key, value) { this.filters.push((row) => row[key] > value); return this; }
  contains(key, values) { this.filters.push((row) => values.every((v) => row[key]?.includes(v))); return this; }
  limit() { return this; }
  update(value) { this.op = 'update'; this.value = value; return this; }
  insert(value) { this.op = 'insert'; this.value = value; return this; }
  single() { this.one = true; this.required = true; return this; }
  maybeSingle() { this.one = true; return this; }
  then(resolve, reject) {
    try {
      if (this.op === 'read' && this.db.failRead === this.table) {
        return Promise.resolve({ data: null, error: new Error('Fixture lookup failure') }).then(resolve, reject);
      }
      if (this.op === 'update' && this.db.failUpdate === this.table) {
        return Promise.resolve({ data: null, error: new Error('Fixture update failure') }).then(resolve, reject);
      }
      if (this.op === 'update' && this.db.beforeUpdate) {
        const hook = this.db.beforeUpdate; this.db.beforeUpdate = null; hook(this);
      }
      const rows = this.db.tables[this.table] ??= [];
      let selected = rows.filter((row) => this.filters.every((filter) => filter(row)));
      if (this.op === 'insert') {
        selected = clone(Array.isArray(this.value) ? this.value : [this.value]).map((row) => ({
          id: 'fixture-created', ...(this.table === 'custom_project_payments' ? { kind: 'token' } : {}), ...row,
        }));
        rows.push(...selected);
      } else if (this.op === 'update') {
        // Simulate the existing 0128 token trigger at the database boundary.
        // Its transaction/rollback behavior is verified separately with PostgreSQL.
        if (this.table === 'custom_project_payments' && this.value.status === 'paid') {
          selected.filter((row) => row.kind === 'token' && row.status !== 'paid').forEach((row) => {
            const request = this.db.tables.custom_project_requests?.find((r) => r.id === row.request_id);
            if (!request || request.user_id !== row.user_id || request.payment_order_id !== row.razorpay_order_id ||
              request.token_amount !== row.amount || row.currency !== 'INR' ||
              (request.token_payment_status === 'paid' && request.payment_id !== this.value.razorpay_payment_id)) {
              throw new Error('Fixture token settlement expectations changed');
            }
            if (request && request.token_payment_status !== 'paid') Object.assign(request, {
              token_payment_status: 'paid', payment_id: this.value.razorpay_payment_id,
              amount_paid: Math.max(request.amount_paid ?? 0, request.token_amount),
            });
          });
        }
        selected.forEach((row) => Object.assign(row, clone(this.value)));
      }
      if (this.op !== 'read' && selected.length) this.db.writes.push({ table: this.table, op: this.op });
      const cardinalityError = this.one && (selected.length > 1 || (this.required && selected.length !== 1));
      return Promise.resolve({
        data: cardinalityError ? null : clone(this.one ? selected[0] ?? null : selected),
        error: cardinalityError ? new Error('Fixture row cardinality mismatch') : null,
      }).then(resolve, reject);
    } catch (error) { return Promise.reject(error).then(resolve, reject); }
  }
}

function loadHandler(name, db, { user = { id: USER }, provider } = {}) {
  const cache = new Map();
  let handler;
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    if (file === path.join(ROOT, '_shared/client.ts')) {
      return { adminClient: () => db, getUser: async () => user };
    }
    const exports = {};
    cache.set(file, exports);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      require: (specifier) => {
        if (!specifier.startsWith('.')) throw new Error(`Unexpected import: ${specifier}`);
        return load(path.resolve(path.dirname(file), specifier));
      },
      Deno: {
        env: { get: (key) => ({ RAZORPAY_KEY_ID: 'fixture-key', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: SECRET })[key] },
        serve: (value) => { handler = value; },
      },
      crypto: webcrypto, TextEncoder, TextDecoder, Request, Response, URL, Date, btoa,
      console: { error() {}, warn() {}, log() {} },
      fetch: provider ?? db.provider ?? network,
      AbortController, setTimeout, clearTimeout,
    }, { filename: file });
    return exports;
  }
  load(path.join(ROOT, name, 'index.ts'));
  return handler;
}

const request = (body) => new Request('http://fixture.invalid', { method: 'POST', body: JSON.stringify(body) });
function signed(localKey = 'orderId', order = 'order_fixture', payment = 'pay_fixture') {
  return {
    [localKey]: 'fixture-target', razorpayOrderId: order, razorpayPaymentId: payment,
    razorpaySignature: createHmac('sha256', SECRET).update(`${order}|${payment}`).digest('hex'),
  };
}

const flows = [
  { name: 'verify-wallet-topup-payment', table: 'wallet_topup_orders', status: 'status', pending: 'created', paid: 'paid', order: 'razorpay_order_id', payment: 'razorpay_payment_id', key: 'orderId', amountPaise: 10000000 },
  { name: 'verify-razorpay-payment', table: 'purchases', status: 'status', pending: 'pending', paid: 'success', order: 'razorpay_order_id', payment: 'razorpay_payment_id', key: 'orderId', amountPaise: 10000 },
  { name: 'verify-premium-payment', table: 'premium_subscriptions', status: 'status', pending: 'pending', paid: 'active', order: 'razorpay_order_id', payment: 'razorpay_payment_id', key: 'orderId', amountPaise: 11800 },
  { name: 'verify-custom-project-payment', table: 'custom_project_requests', status: 'token_payment_status', pending: 'pending', paid: 'paid', order: 'payment_order_id', payment: 'payment_id', key: 'requestId', amountPaise: 1000 },
  { name: 'verify-custom-project-balance-payment', table: 'custom_project_payments', status: 'status', pending: 'created', paid: 'paid', order: 'razorpay_order_id', payment: 'razorpay_payment_id', key: 'paymentId', amountPaise: 10000000 },
];

function fixture(flow, overrides = {}) {
  const row = {
    id: 'fixture-target', user_id: USER, amount: 100000, total_amount: 100, billing_cycle: 'monthly',
    price: 100, plan_id: 'fixture-plan', currency: 'INR', project_id: 'fixture-project', project: { title: 'Fixture' }, kind: 'balance', request_id: 'fixture-request',
    ...(flow.table === 'premium_subscriptions' && overrides.status === 'active' ? {
      started_at: '2024-01-31T12:00:00.000Z', current_period_end: '2024-03-02T12:00:00.000Z',
    } : {}),
    token_amount: 10, estimated_total: 100, title: 'Fixture', request_code: 'CPR-FIXTURE',
    [flow.status]: flow.pending, [flow.order]: 'order_fixture', [flow.payment]: null, ...overrides,
  };
  const db = new FixtureDB({ [flow.table]: [row] });
  if (flow.table === 'premium_subscriptions') db.tables.premium_plans = [{ id: 'fixture-plan' }];
  if (flow.table === 'wallet_topup_orders' && row.status === 'paid') db.tables.wallet_transactions = [{
    topup_order_id: row.id, user_id: row.user_id, type: 'credit', category: 'added_money', amount: Number(row.amount),
  }];
  if (flow.key === 'requestId') db.tables.custom_project_payments = [{
    id: 'fixture-token', request_id: row.id, user_id: USER, kind: 'token',
    amount: 10, currency: 'INR', status: row.token_payment_status === 'paid' ? 'paid' : 'created',
    razorpay_order_id: 'order_fixture', razorpay_payment_id: row.token_payment_status === 'paid' ? row.payment_id : null,
  }];
  if (flow.key === 'paymentId') db.tables.custom_project_requests = [{
    id: row.request_id, user_id: USER, token_payment_status: 'paid', title: 'Fixture',
  }];
  db.provider = jest.fn(async () => paymentResponse(capturedPayment(flow.amountPaise)));
  return db;
}

function capturedPayment(amount, overrides = {}) {
  return { id: 'pay_fixture', entity: 'payment', status: 'captured', captured: true,
    order_id: 'order_fixture', amount, currency: 'INR', ...overrides };
}
function paymentResponse(entity) {
  return new Response(JSON.stringify(entity), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => network.mockClear());
afterEach(() => expect(network).not.toHaveBeenCalled());

describe('SEC-05 premium activation', () => {
  const flow = flows[2];
  const call = (db, entry) => entry === 'callback'
    ? loadHandler(flow.name, db)(request(signed()))
    : loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', 11800));
  const bounded = (db) => {
    const sub = db.tables.premium_subscriptions[0];
    const end = new Date(sub.started_at);
    if (sub.billing_cycle === 'yearly') end.setUTCFullYear(end.getUTCFullYear() + 1);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    expect(sub.status).toBe('active');
    expect(sub.current_period_end).toBe(end.toISOString());
    expect(Date.parse(sub.current_period_end)).toBeGreaterThan(Date.parse(sub.started_at));
  };
  it.each(['monthly', 'yearly'])('%s uses existing duration rules', async (billing_cycle) => {
    for (const entry of ['callback', 'webhook']) {
      const db = fixture(flow, { billing_cycle });
      expect((await call(db, entry)).status).toBe(200); bounded(db);
    }
  });
  it.each([[1.25, 147], [5.75, 678], [6.75, 796], [10.75, 1268]])('preserves existing GST for price %s', async (price, paise) => {
    const db = fixture(flow, { price });
    db.provider = jest.fn(async () => paymentResponse(capturedPayment(paise)));
    expect((await call(db, 'callback')).status).toBe(200); bounded(db);
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', paise))).status).toBe(200);
    expect(db.writes).toHaveLength(1);
  });
  it.each(['callback', 'webhook'])('%s first then repeated callbacks/webhooks preserves the established row', async (entry) => {
    const db = fixture(flow);
    expect((await call(db, entry)).status).toBe(200); bounded(db);
    const saved = clone(db.tables.premium_subscriptions[0]);
    for (const next of ['callback', 'webhook', 'webhook']) expect((await call(db, next)).status).toBe(200);
    expect(db.tables.premium_subscriptions[0]).toEqual(saved); expect(db.writes).toHaveLength(1);
  });
  it.each([['callback', 'callback'], ['callback', 'webhook'], ['webhook', 'webhook']])('%s/%s activates once', async (a, b) => {
    const db = fixture(flow);
    const responses = await Promise.all([call(db, a), call(db, b)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    bounded(db); expect(db.writes).toHaveLength(1); expect(db.premiumRpcCalls).toBe(2);
  });
  describe.each(['callback', 'webhook'])('%s', (entry) => {
    it('fails on transaction failure and retries once', async () => {
      const db = fixture(flow); db.settlementFailure = true;
      expect((await call(db, entry)).status).toBe(500); expect(db.writes).toEqual([]);
      expect(db.tables.premium_subscriptions[0].status).toBe('pending');
      db.settlementFailure = false;
      expect((await call(db, entry)).status).toBe(200); bounded(db); expect(db.writes).toHaveLength(1);
    });
    it('fails closed on lookup error', async () => {
      const db = fixture(flow); db.failRead = 'premium_subscriptions';
      expect((await call(db, entry)).status).toBe(500); expect(db.writes).toEqual([]);
    });
    it.each([{ plan_id: null }, { plan_id: 'missing' }, { billing_cycle: 'weekly' }, { status: 'cancelled' },
      { status: 'expired', started_at: '2024-01-01', current_period_end: '2024-02-01' },
      { status: 'active', razorpay_payment_id: 'pay_fixture', started_at: null, current_period_end: null },
      { status: 'active', razorpay_payment_id: 'pay_fixture', current_period_end: '2023-01-01' },
      { status: 'active', razorpay_payment_id: 'pay_fixture', current_period_end: 'infinity' },
    ])('rejects invalid lifecycle/period %j without repair', async (overrides) => {
      const db = fixture(flow, overrides); const saved = clone(db.tables.premium_subscriptions[0]);
      expect((await call(db, entry)).status).toBe(500);
      expect(db.tables.premium_subscriptions[0]).toEqual(saved); expect(db.writes).toEqual([]);
    });
    it('preserves legitimate prior periods, including extensions and disabled renewal', async () => {
      const db = fixture(flow, { status: 'active', razorpay_payment_id: 'pay_fixture', auto_renew: false,
        started_at: '2020-01-31T12:00:00.000Z', current_period_end: '2020-06-01T12:00:00.000Z' });
      const saved = clone(db.tables.premium_subscriptions[0]);
      expect((await call(db, entry)).status).toBe(200);
      expect(db.tables.premium_subscriptions[0]).toEqual(saved); expect(db.writes).toEqual([]);
    });
    it.each(['plan_id', 'billing_cycle', 'price', 'user_id'])('rechecks changed %s transactionally', async (column) => {
      const db = fixture(flow);
      db.beforeUpdate = () => { db.tables.premium_subscriptions[0][column] = column === 'price' ? 1 : 'changed'; };
      expect((await call(db, entry)).status).toBe(500); expect(db.writes).toEqual([]);
    });
    it.each(['id', 'user_id', 'plan_id', 'billing_cycle', 'price', 'razorpay_order_id', 'razorpay_payment_id',
      'status', 'started_at', 'current_period_end', 'alreadyActive'])('rejects unconfirmed RPC %s and retries after uncertain commit', async (column) => {
      const db = fixture(flow);
      db.premiumReply = (data) => {
        if (column === 'alreadyActive') delete data.alreadyActive;
        else data.subscription[column] = column === 'price' ? 1 : null;
        return data;
      };
      expect((await call(db, entry)).status).toBe(500);
      const saved = clone(db.tables.premium_subscriptions[0]); delete db.premiumReply;
      expect((await call(db, entry)).status).toBe(200);
      expect(db.tables.premium_subscriptions[0]).toEqual(saved); expect(db.writes).toHaveLength(1);
    });
  });
});

describe.each(flows)('$name: SEC-01', (flow) => {
  it('accepts an exactly bound, correctly signed payment and preserves its response contract', async () => {
    const db = fixture(flow);
    const response = await loadHandler(flow.name, db)(request(signed(flow.key)));
    expect(response.status).toBe(200);
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.paid);
    expect(db.tables[flow.table][0][flow.payment]).toBe('pay_fixture');
    const body = await response.json();
    if (flow.table === 'wallet_topup_orders') expect(body).toEqual({ ok: true, amount: 100000 });
    else if (flow.table === 'premium_subscriptions') expect(body).toEqual({ subscriptionId: 'fixture-target' });
    else expect(body.id).toBe(flow.key === 'paymentId' ? 'fixture-request' : 'fixture-target');
  });

  it.each([null, undefined, '', '   ', 'order_unrelated'])('rejects stored binding %s without any writes', async (binding) => {
    const db = fixture(flow, { [flow.order]: binding });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it.each([null, undefined, '', '   ', 42, {}, []])('rejects malformed provider order input %j without writes', async (value) => {
    const db = fixture(flow);
    expect((await loadHandler(flow.name, db)(request({ ...signed(flow.key), razorpayOrderId: value }))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it.each(['razorpayPaymentId', 'razorpaySignature', flow.key])('rejects a nonstring %s without writes', async (key) => {
    const db = fixture(flow);
    expect((await loadHandler(flow.name, db)(request({ ...signed(flow.key), [key]: {} }))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('rejects a null request body', async () => {
    const db = fixture(flow);
    expect((await loadHandler(flow.name, db)(request(null))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('rejects an unbound row even when its status says settled', async () => {
    const db = fixture(flow, { [flow.order]: null, [flow.status]: flow.paid, [flow.payment]: 'pay_fixture' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('rejects a signed pair replayed against a different unbound order', async () => {
    const db = fixture(flow, { [flow.order]: null });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key, 'order_smaller')))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('rejects another order signed with the same payment id', async () => {
    const db = fixture(flow);
    db.tables.wallet_topup_orders ??= [];
    db.tables.wallet_topup_orders.push({ id: 'unrelated', status: 'paid', razorpay_order_id: 'order_smaller', razorpay_payment_id: 'pay_fixture' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('fails closed when a reuse lookup fails', async () => {
    const db = fixture(flow); db.failRead = 'premium_subscriptions';
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(500);
    expect(db.writes).toEqual([]);
  });

  it('rejects a different payment on an already settled order', async () => {
    const db = fixture(flow, { [flow.status]: flow.paid, [flow.payment]: 'pay_original' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('keeps a retry with the same bound pair idempotent', async () => {
    const db = fixture(flow, { [flow.status]: flow.paid, [flow.payment]: 'pay_fixture' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(200);
    expect(db.writes).toEqual([]);
  });

  it('authenticates a retry before returning success', async () => {
    const db = fixture(flow, { [flow.status]: flow.paid, [flow.payment]: 'pay_fixture' });
    expect((await loadHandler(flow.name, db)(request({ ...signed(flow.key), razorpaySignature: 'bad' }))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('preserves a successful retry after an earlier failed payment attempt', async () => {
    const db = fixture(flow, { [flow.status]: flow.table === 'premium_subscriptions' ? 'expired' : 'failed', [flow.payment]: 'pay_failed_attempt' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(200);
    expect(db.tables[flow.table][0][flow.payment]).toBe('pay_fixture');
  });

  it('rejects another owner before any writes', async () => {
    const db = fixture(flow, { user_id: 'another-owner' });
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(403);
    expect(db.writes).toEqual([]);
  });

  it('does not settle if the stored binding changes between reading and writing', async () => {
    const db = fixture(flow);
    db.beforeUpdate = () => { db.tables[flow.table][0][flow.order] = null; };
    const response = await loadHandler(flow.name, db)(request(signed(flow.key)));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.pending);
    expect(db.writes).toEqual([]);
  });

  it('concurrent replays against unrelated unbound rows never grant value', async () => {
    const db = fixture(flow, { [flow.order]: null });
    db.tables[flow.table].push({ ...db.tables[flow.table][0], id: 'fixture-other' });
    const handler = loadHandler(flow.name, db);
    const results = await Promise.all([
      handler(request(signed(flow.key))),
      handler(request({ ...signed(flow.key), [flow.key]: 'fixture-other' })),
    ]);
    expect(results.map((response) => response.status)).toEqual([400, 400]);
    expect(db.writes).toEqual([]);
  });
});

it('concurrent wallet callbacks for the same bound pair credit once', async () => {
  const db = fixture(flows[0]);
  const handler = loadHandler(flows[0].name, db);
  const results = await Promise.all([handler(request(signed())), handler(request(signed()))]);
  expect(results.map((response) => response.status)).toEqual([200, 200]);
  expect(db.tables.wallet_transactions).toHaveLength(1);
});

describe('SEC-04 atomic purchase settlement', () => {
  const flow = flows[1];
  const send = (db, entry, overrides = {}, event = 'payment.captured') => entry === 'callback'
    ? loadHandler(flow.name, db)(request({ ...signed(), ...overrides }))
    : loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', 10000, overrides, event));
  const assertSettledOnce = (db) => {
    expect(db.tables.purchases[0].status).toBe('success');
    expect(db.tables.wallet_transactions).toEqual([expect.objectContaining({
      purchase_id: 'fixture-target', user_id: USER, type: 'debit', category: 'project_purchase', amount: 100,
    })]);
    expect(db.writes.filter((write) => write.table === 'sales')).toHaveLength(1);
  };

  it.each([['callback', 'callback'], ['callback', 'webhook'], ['webhook', 'webhook']])(
    'converges %s/%s and repeated deliveries on one debit and sales increment', async (first, second) => {
      const db = fixture(flow);
      const responses = await Promise.all([send(db, first), send(db, second)]);
      expect(responses.map((r) => r.status)).toEqual([200, 200]);
      const callbackBody = await responses[0].json();
      if (first === 'callback') expect(callbackBody).toEqual(expect.objectContaining({
        id: 'fixture-target', status: 'success', project: { title: 'Fixture' }, total_amount: 100,
      }));
      expect((await send(db, 'callback')).status).toBe(200);
      const replay = await send(db, 'webhook');
      expect(await replay.json()).toEqual(expect.objectContaining({ alreadySettled: true, orderType: 'purchase' }));
      assertSettledOnce(db);
    },
  );

  it.each(['callback', 'webhook'])('%s rolls back failed settlement/debit/sales and retries', async (entry) => {
    for (const failure of ['settlementFailure', 'debitFailure', 'salesFailure']) {
      const db = fixture(flow); db[failure] = true;
      expect((await send(db, entry)).status).toBe(500);
      expect(db.tables.purchases[0].status).toBe('pending');
      expect(db.writes).toEqual([]);
      db[failure] = false;
      expect((await send(db, entry)).status).toBe(200);
      expect((await send(db, entry)).status).toBe(200);
      assertSettledOnce(db);
    }
  });

  it('invalid signature cannot overwrite a concurrent successful callback', async () => {
    const db = fixture(flow);
    const responses = await Promise.all([send(db, 'callback', { razorpaySignature: 'bad' }), send(db, 'callback')]);
    expect(responses.map((r) => r.status)).toEqual([400, 200]);
    assertSettledOnce(db);
  });

  it('failure predicate is reevaluated after a concurrent success', async () => {
    const db = fixture(flow);
    db.beforeUpdate = () => { Object.assign(db.tables.purchases[0], { status: 'success', razorpay_payment_id: 'pay_fixture' }); };
    expect((await send(db, 'callback', { razorpaySignature: 'bad' })).status).toBe(400);
    expect(db.tables.purchases[0].status).toBe('success');
    expect(db.writes).toEqual([]);
  });

  it.each(['refunded', 'cancelled', 'revoked'])('never reopens a %s purchase from stale capture/failure', async (status) => {
    const db = fixture(flow, { status, razorpay_payment_id: 'pay_fixture' });
    for (const entry of ['callback', 'webhook']) expect((await send(db, entry)).status).toBeGreaterThanOrEqual(400);
    expect((await send(db, 'callback', { razorpaySignature: 'bad' })).status).toBe(400);
    const failure = await send(db, 'webhook', { status: 'failed', captured: false }, 'payment.failed');
    expect(failure.status).toBe(200);
    expect((await failure.json()).status).toBe(status);
    expect(db.tables.purchases[0].status).toBe(status);
    expect(db.writes).toEqual([]);
  });

  it('a delayed signed payment failure cannot downgrade a settled purchase', async () => {
    const db = fixture(flow);
    expect((await send(db, 'callback')).status).toBe(200);
    const failure = await send(db, 'webhook', { status: 'failed', captured: false }, 'payment.failed');
    expect(await failure.json()).toEqual({
      received: true, handled: true, alreadySettled: true, orderType: 'purchase', orderId: 'order_fixture',
    });
    assertSettledOnce(db);
  });

  it('rechecks terminal state inside the RPC after capture verification', async () => {
    const db = fixture(flow); db.beforeUpdate = () => { db.tables.purchases[0].status = 'refunded'; };
    expect((await send(db, 'callback')).status).toBe(500);
    expect(db.writes).toEqual([]);
  });

  it('preserves verified historical entitlements without creating missing historical effects', async () => {
    const db = fixture(flow, { status: 'success', razorpay_payment_id: 'pay_fixture' });
    expect((await send(db, 'callback')).status).toBe(200);
    expect((await send(db, 'webhook')).status).toBe(200);
    expect(db.writes).toEqual([]);
  });

  it('fails closed when the RPC returns an unconfirmed result', async () => {
    const db = fixture(flow); db.malformedPurchaseReply = true;
    expect((await send(db, 'callback')).status).toBe(500);
    db.malformedPurchaseReply = false;
    expect((await send(db, 'callback')).status).toBe(200);
    assertSettledOnce(db);
  });

  it('does not invoke settlement on rejected provider evidence or failed purchase lookup', async () => {
    const db = fixture(flow); db.provider = jest.fn(async () => paymentResponse(capturedPayment(1)));
    expect((await send(db, 'callback')).status).toBe(400);
    expect(db.purchaseRpcCalls ?? 0).toBe(0);
    db.failRead = 'purchases';
    expect((await send(db, 'webhook')).status).toBe(500);
    expect(db.purchaseRpcCalls ?? 0).toBe(0);
  });
});

it('rejects a token request whose ledger was never linked', async () => {
  const db = fixture(flows[3]); db.tables.custom_project_payments[0].razorpay_order_id = null;
  expect((await loadHandler(flows[3].name, db)(request(signed('requestId')))).status).toBe(400);
  expect(db.writes).toEqual([]);
});

function webhookRequest(order = 'order_fixture', payment = 'pay_fixture', amount = 10000000, overrides = {}, event = 'payment.captured') {
  const body = JSON.stringify({ event, payload: { payment: { entity: capturedPayment(amount, { order_id: order, id: payment, ...overrides }) } } });
  return new Request('http://fixture.invalid', {
    method: 'POST', body,
    headers: { 'x-razorpay-signature': createHmac('sha256', SECRET).update(body).digest('hex') },
  });
}

describe.each([flows[0], flows[1], flows[2], flows[4]])('webhook binding: $table', (flow) => {
  it('settles a bound fixture from a signed event', async () => {
    const db = fixture(flow);
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise))).status).toBe(200);
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.paid);
    expect(db.tables[flow.table][0][flow.payment]).toBe('pay_fixture');
  });
  it('rejects payment reuse from another surface before writes', async () => {
    const db = fixture(flow);
    db.tables.custom_project_requests ??= [];
    db.tables.custom_project_requests.push({ id: 'unrelated-token', payment_order_id: 'order_unrelated', payment_id: 'pay_fixture' });
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });
  it('does not settle an unbound row from provider metadata', async () => {
    const db = fixture(flow, { [flow.order]: null });
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise))).status).toBe(200);
    expect(db.writes).toEqual([]);
  });
});

it('a wallet callback/webhook race for one bound pair credits once', async () => {
  const db = fixture(flows[0]);
  const callback = loadHandler(flows[0].name, db);
  const webhook = loadHandler('razorpay-webhook', db);
  const results = await Promise.all([callback(request(signed())), webhook(webhookRequest())]);
  expect(results.map((response) => response.status)).toEqual([200, 200]);
  expect(db.tables.wallet_transactions).toHaveLength(1);
});

describe.each(['callback', 'webhook'])('SEC-03 %s settlement', (entry) => {
  const call = (db) => loadHandler(entry === 'callback' ? flows[0].name : 'razorpay-webhook', db)(
    entry === 'callback' ? request(signed()) : webhookRequest(),
  );
  it('replays only after confirming one corresponding credit', async () => {
    const db = fixture(flows[0]);
    expect((await call(db)).status).toBe(200);
    expect((await call(db)).status).toBe(200);
    expect(db.tables.wallet_transactions).toHaveLength(1);
    expect(db.tables.wallet_transactions[0].topup_order_id).toBe('fixture-target');
  });
  it('does not acknowledge a failed order lookup as a successful delivery', async () => {
    const db = fixture(flows[0]); db.failRead = 'wallet_topup_orders';
    expect((await call(db)).status).toBe(500);
    expect(db.writes).toEqual([]);
  });
  it.each(['settlementFailure', 'creditFailure'])('fails closed on %s and retries without losing or duplicating credit', async (failure) => {
    const db = fixture(flows[0]); db[failure] = true;
    expect((await call(db)).status).toBe(500);
    expect(db.tables.wallet_topup_orders[0].status).toBe('created');
    expect(db.tables.wallet_transactions ?? []).toHaveLength(0);
    db[failure] = false;
    expect((await call(db)).status).toBe(200);
    expect((await call(db)).status).toBe(200);
    expect(db.tables.wallet_transactions).toHaveLength(1);
  });
  it.each(['missing', 'unlinked', 'amount', 'owner', 'type', 'category'])('rejects historical/inconsistent credit: %s without automatic repair', async (problem) => {
    const db = fixture(flows[0], { status: 'paid', razorpay_payment_id: 'pay_fixture' });
    if (problem === 'missing') db.tables.wallet_transactions = [];
    else {
      const credit = db.tables.wallet_transactions[0];
      if (problem === 'unlinked') credit.topup_order_id = null;
      if (problem === 'amount') credit.amount = 1;
      if (problem === 'owner') credit.user_id = 'another-owner';
      if (problem === 'type') credit.type = 'debit';
      if (problem === 'category') credit.category = 'cashback';
    }
    expect((await call(db)).status).toBe(500);
    expect(db.writes).toEqual([]);
    if (entry === 'callback') expect(db.provider).toHaveBeenCalledTimes(1);
  });
  it.each([null, {}, { amount: 100000 }, { amount: 1, alreadySettled: false }])('requires an explicit matching RPC success result: %j', async (data) => {
    const db = fixture(flows[0]);
    const original = db.rpc.bind(db);
    db.rpc = (name, params) => name === 'settle_wallet_topup' ? { data, error: null } : original(name, params);
    expect((await call(db)).status).toBe(500);
    expect(db.writes).toEqual([]);
  });
});

it('SEC-03 multiple callback and webhook deliveries produce one credit', async () => {
  const db = fixture(flows[0]);
  const callback = loadHandler(flows[0].name, db);
  const webhook = loadHandler('razorpay-webhook', db);
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => (
    i % 2 ? callback(request(signed())) : webhook(webhookRequest())
  )));
  expect(results.map((response) => response.status)).toEqual(Array(8).fill(200));
  expect(db.tables.wallet_transactions).toHaveLength(1);
});

const creationFlows = [
  { name: 'create-wallet-topup-order', table: 'wallet_topup_orders', body: { amount: 10 } },
  { name: 'create-razorpay-order', table: 'purchases', body: { projectId: 'fixture-project' } },
  { name: 'create-premium-order', table: 'premium_subscriptions', body: { planId: 'fixture-plan', billingCycle: 'monthly' } },
  { name: 'create-custom-project-order', table: 'custom_project_requests', body: { title: 'Fixture', projectType: 'personal', projectLevel: 'standard', platform: 'web', featureIds: [], serviceScope: 'custom_software', assessmentUse: 'no', integrityAcknowledged: true } },
  { name: 'create-custom-project-balance-order', table: 'custom_project_payments', body: { requestId: 'fixture-request' } },
];
function creationDB() {
  return new FixtureDB({
    projects: [{ id: 'fixture-project', title: 'Fixture', price: 10, platform_fee_percent: 2 }],
    premium_plans: [{ id: 'fixture-plan', name: 'Fixture', monthly_price: 10, yearly_price: 100 }],
    custom_project_requests: [{ id: 'fixture-request', user_id: USER, title: 'Fixture', project_type: 'personal', token_payment_status: 'paid', status: 'new' }],
    custom_project_pricing: [{ project_type: 'personal', project_level: 'standard', is_active: true, base_price: 100, token_amount: 10, pricing_version: 1 }],
    custom_project_platform_pricing: [{ platform: 'web', is_active: true, charge: 0 }],
  });
}

describe.each(creationFlows)('$name: binding creation', (flow) => {
  it('returns the checkout contract only after a persistent provider link exists', async () => {
    const db = creationDB();
    const provider = jest.fn(async () => new Response(JSON.stringify({ id: 'order_fixture' }), { status: 200 }));
    const response = await loadHandler(flow.name, db, { provider })(request(flow.body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ razorpayOrderId: 'order_fixture', currency: 'INR' }));
    expect(db.tables[flow.table].some((row) => (row.razorpay_order_id ?? row.payment_order_id) === 'order_fixture')).toBe(true);
  });
  it.each([null, '', '   ', 12])('rejects a provider response without a valid identifier (%j)', async (id) => {
    const db = creationDB();
    const provider = jest.fn(async () => new Response(JSON.stringify({ id }), { status: 200 }));
    expect((await loadHandler(flow.name, db, { provider })(request(flow.body))).status).toBe(500);
    expect(db.tables[flow.table]?.some((row) => row.razorpay_order_id != null || row.payment_order_id != null) ?? false).toBe(false);
  });
  if (flow.name !== 'create-custom-project-balance-order') {
    it('does not return checkout success for a zero-row link write', async () => {
      const db = creationDB();
      db.beforeUpdate = (query) => { db.tables[query.table].length = 0; };
      const provider = jest.fn(async () => new Response(JSON.stringify({ id: 'order_fixture' }), { status: 200 }));
      expect((await loadHandler(flow.name, db, { provider })(request(flow.body))).status).toBe(500);
    });
  }
});

// SEC-02 executes the actual handlers, capture validator and HMAC. Provider responses
// below are fabricated HTTP boundaries; network remains forbidden by afterEach.
const invalidCaptures = [
  ['authorized', { status: 'authorized', captured: false }],
  ['failed', { status: 'failed', captured: false }],
  ['cancelled', { status: 'cancelled', captured: false }],
  ['refunded', { status: 'refunded' }],
  ['wrong payment', { id: 'pay_other' }],
  ['wrong order', { order_id: 'order_other' }],
  ['wrong amount', { amount: 1 }],
  ['wrong currency', { currency: 'USD' }],
  ['missing payment id', { id: undefined }],
  ['missing order id', { order_id: undefined }],
  ['missing amount', { amount: undefined }],
  ['missing currency', { currency: undefined }],
  ['missing status', { status: undefined }],
  ['missing captured flag', { captured: undefined }],
  ['contradictory captured flag', { captured: false }],
  ['string captured flag', { captured: 'true' }],
  ['string amount', { amount: '1000' }],
  ['fractional amount', { amount: 1000.5 }],
  ['wrong entity type', { entity: 'order' }],
  ['missing entity type', { entity: undefined }],
];

describe.each(flows)('$name: SEC-02 authoritative capture', (flow) => {
  it('fetches the exact payment over authenticated GET and grants only a captured payment', async () => {
    const db = fixture(flow);
    const response = await loadHandler(flow.name, db)(request({ ...signed(flow.key), amount: 1, currency: 'USD' }));
    expect(response.status).toBe(200);
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.paid);
    expect(db.provider).toHaveBeenCalledTimes(1);
    const [url, options] = db.provider.mock.calls[0];
    expect(url).toBe('https://api.razorpay.com/v1/payments/pay_fixture');
    expect(options).toEqual(expect.objectContaining({ method: 'GET', redirect: 'error' }));
    expect(options.headers.Authorization).toBe(`Basic ${btoa(`fixture-key:${SECRET}`)}`);
    expect(options.signal.aborted).toBe(false);
  });

  it.each(invalidCaptures)('rejects %s without financial or entitlement writes', async (_label, overrides) => {
    const db = fixture(flow);
    const provider = jest.fn(async () => paymentResponse(capturedPayment(flow.amountPaise, overrides)));
    expect((await loadHandler(flow.name, db, { provider })(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.pending);
  });

  it.each([null, [], {}, 'captured', 42])('rejects a malformed JSON payment entity %j', async (entity) => {
    const db = fixture(flow);
    const provider = jest.fn(async () => paymentResponse(entity));
    expect((await loadHandler(flow.name, db, { provider })(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it.each([401, 404, 429, 500, 502])('fails closed on Razorpay HTTP %i without exposing its body', async (status) => {
    const db = fixture(flow);
    const provider = jest.fn(async () => new Response('fixture-private-provider-detail', { status }));
    const response = await loadHandler(flow.name, db, { provider })(request(signed(flow.key)));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('fixture-private-provider-detail');
    expect(db.writes).toEqual([]);
  });

  it.each(['bad JSON', 'wrong content type', 'network error'])('fails closed on %s', async (failure) => {
    const db = fixture(flow);
    const provider = jest.fn(async () => {
      if (failure === 'network error') throw new Error('fixture-private-network-detail');
      return new Response(failure === 'bad JSON' ? '{broken' : JSON.stringify(capturedPayment(flow.amountPaise)), {
        headers: { 'Content-Type': failure === 'bad JSON' ? 'application/json' : 'text/html' },
      });
    });
    const response = await loadHandler(flow.name, db, { provider })(request(signed(flow.key)));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('fixture-private-network-detail');
    expect(db.writes).toEqual([]);
  });

  it('aborts a stalled API request, leaves the order unsettled and allows a captured retry', async () => {
    jest.useFakeTimers();
    try {
      const db = fixture(flow);
      let started;
      const ready = new Promise((resolve) => { started = resolve; });
      let signal;
      const provider = jest.fn((_url, options) => new Promise((_resolve, reject) => {
        signal = options.signal;
        signal.addEventListener('abort', () => reject(new Error('Fixture timeout')));
        started();
      }));
      const result = loadHandler(flow.name, db, { provider })(request(signed(flow.key)));
      await ready;
      await jest.advanceTimersByTimeAsync(8000);
      expect((await result).status).toBe(503);
      expect(signal.aborted).toBe(true);
      expect(db.writes).toEqual([]);
      expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(200);
    } finally { jest.useRealTimers(); }
  });

  it('checks capture again for a settled retry and fails closed if Razorpay is unavailable', async () => {
    const db = fixture(flow, { [flow.status]: flow.paid, [flow.payment]: 'pay_fixture' });
    const provider = jest.fn(async () => { throw new Error('Fixture offline'); });
    expect((await loadHandler(flow.name, db, { provider })(request(signed(flow.key)))).status).toBe(503);
    expect(db.writes).toEqual([]);
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(200);
    expect(db.writes).toEqual([]);
  });

  it('rejects an authorized payment even when local state says settled', async () => {
    const db = fixture(flow, { [flow.status]: flow.paid, [flow.payment]: 'pay_fixture' });
    const provider = jest.fn(async () => paymentResponse(capturedPayment(flow.amountPaise, { status: 'authorized', captured: false })));
    expect((await loadHandler(flow.name, db, { provider })(request(signed(flow.key)))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('does not contact Razorpay for an absent SEC-01 binding or another owner', async () => {
    for (const overrides of [{ [flow.order]: null }, { user_id: 'another-owner' }]) {
      const db = fixture(flow, overrides);
      expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBeGreaterThanOrEqual(400);
      expect(db.provider).not.toHaveBeenCalled();
      expect(db.writes).toEqual([]);
    }
  });

  it('does not settle a different amount changed during provider verification', async () => {
    const db = fixture(flow);
    const amountColumn = { purchases: 'total_amount', premium_subscriptions: 'price', custom_project_requests: 'token_amount' }[flow.table] ?? 'amount';
    db.beforeUpdate = () => { db.tables[flow.table][0][amountColumn] += 1; };
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBeGreaterThanOrEqual(400);
    expect(db.writes).toEqual([]);
  });

  it('verifies decimal stored amounts in paise, including the existing premium GST rounding', async () => {
    const db = fixture(flow);
    const amountColumn = { purchases: 'total_amount', premium_subscriptions: 'price', custom_project_requests: 'token_amount' }[flow.table] ?? 'amount';
    db.tables[flow.table][0][amountColumn] = flow.table === 'premium_subscriptions' ? '74.75' : '10.01';
    if (flow.key === 'requestId') db.tables.custom_project_payments[0].amount = '10.01';
    const provider = jest.fn(async () => paymentResponse(capturedPayment(flow.table === 'premium_subscriptions' ? 8821 : 1001)));
    expect((await loadHandler(flow.name, db, { provider })(request(signed(flow.key)))).status).toBe(200);
  });

  it.each([null, '', 'invalid', -1])('rejects an invalid stored amount %j before provider HTTP', async (amount) => {
    const db = fixture(flow);
    const amountColumn = { purchases: 'total_amount', premium_subscriptions: 'price', custom_project_requests: 'token_amount' }[flow.table] ?? 'amount';
    db.tables[flow.table][0][amountColumn] = amount;
    expect((await loadHandler(flow.name, db)(request(signed(flow.key)))).status).toBe(400);
    expect(db.provider).not.toHaveBeenCalled();
    expect(db.writes).toEqual([]);
  });
});

it('times out while reading the provider response body', async () => {
  jest.useFakeTimers();
  try {
    const db = fixture(flows[0]);
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    const provider = jest.fn(async (_url, options) => ({
      status: 200, headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Fixture body timeout')));
        started();
      }),
    }));
    const result = loadHandler(flows[0].name, db, { provider })(request(signed()));
    await ready;
    await jest.advanceTimersByTimeAsync(8000);
    expect((await result).status).toBe(503);
    expect(db.writes).toEqual([]);
  } finally { jest.useRealTimers(); }
});

const webhookFlows = [flows[0], flows[1], flows[2], flows[4], {
  ...flows[4], pending: 'created', amountPaise: 1000, label: 'token',
}];
function webhookFixture(flow) {
  if (flow.label !== 'token') return fixture(flow);
  const db = fixture(flows[3]);
  db.tables.custom_project_payments[0].id = 'fixture-target';
  return db;
}
describe('custom-project settlement acknowledgement', () => {
  it('does not acknowledge a failed custom payment lookup', async () => {
    const db = fixture(flows[4]); db.failRead = 'custom_project_payments';
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest())).status).toBe(500);
    expect(db.writes).toEqual([]);
  });

  it.each(['payment.captured', 'payment.failed'])('retries %s after a database write failure', async (event) => {
    const db = fixture(flows[4]); db.failUpdate = 'custom_project_payments';
    const handler = loadHandler('razorpay-webhook', db);
    const send = () => handler(webhookRequest('order_fixture', 'pay_fixture', flows[4].amountPaise,
      event === 'payment.failed' ? { status: 'failed', captured: false } : {}, event));
    expect((await send()).status).toBe(500);
    expect(db.writes).toEqual([]);
    db.failUpdate = null;
    expect((await send()).status).toBe(200);
    expect(db.writes).toHaveLength(1);
  });

  it('does not acknowledge a capture whose conditional update matched no committed settlement', async () => {
    const db = fixture(flows[4]);
    db.beforeUpdate = () => { db.tables.custom_project_payments[0].status = 'unexpected'; };
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest())).status).toBe(500);
    expect(db.writes).toEqual([]);
  });

  it('preserves a refund response on repeated balance callbacks', async () => {
    const db = fixture(flows[4], { status: 'refund_due', razorpay_payment_id: 'pay_fixture' });
    const handler = loadHandler(flows[4].name, db);
    for (let i = 0; i < 2; i++) {
      const response = await handler(request(signed('paymentId')));
      expect(response.status).toBe(409);
      expect((await response.json()).error).toMatch(/refund/);
    }
    expect(db.writes).toEqual([]);
  });

  it('fails a balance callback when its final settlement read fails', async () => {
    const db = fixture(flows[4]);
    db.beforeUpdate = () => { db.failRead = 'custom_project_payments'; };
    expect((await loadHandler(flows[4].name, db)(request(signed('paymentId')))).status).toBe(500);
  });

  it('keeps the token request unpaid if its ledger write fails, then retries once', async () => {
    const db = fixture(flows[3]); db.failUpdate = 'custom_project_payments';
    const handler = loadHandler(flows[3].name, db);
    expect((await handler(request(signed('requestId')))).status).toBe(500);
    expect(db.tables.custom_project_requests[0].token_payment_status).toBe('pending');
    expect(db.writes).toEqual([]);
    db.failUpdate = null;
    expect((await handler(request(signed('requestId')))).status).toBe(200);
    expect((await handler(request(signed('requestId')))).status).toBe(200);
    expect(db.tables.custom_project_requests[0].token_payment_status).toBe('paid');
    expect(db.writes).toEqual([{ table: 'custom_project_payments', op: 'update' }]);
  });

  it('completes a legacy request-first partial settlement rather than leaving its ledger open', async () => {
    const db = fixture(flows[3], { token_payment_status: 'paid', payment_id: 'pay_fixture' });
    Object.assign(db.tables.custom_project_payments[0], { status: 'created', razorpay_payment_id: null });
    expect((await loadHandler(flows[3].name, db)(request(signed('requestId')))).status).toBe(200);
    expect(db.tables.custom_project_payments[0].status).toBe('paid');
  });

  it('a delayed invalid token callback cannot downgrade a concurrent capture', async () => {
    const db = fixture(flows[3]);
    db.beforeUpdate = () => {
      Object.assign(db.tables.custom_project_requests[0], { token_payment_status: 'paid', payment_id: 'pay_fixture' });
      Object.assign(db.tables.custom_project_payments[0], { status: 'paid', razorpay_payment_id: 'pay_fixture' });
    };
    expect((await loadHandler(flows[3].name, db)(request({ ...signed('requestId'), razorpaySignature: 'invalid' }))).status).toBe(400);
    expect(db.tables.custom_project_requests[0].token_payment_status).toBe('paid');
    expect(db.tables.custom_project_payments[0].status).toBe('paid');
    expect(db.writes).toEqual([]);
  });
});
describe.each(webhookFlows)('SEC-02 signed webhook: $table $label', (flow) => {
  it('accepts a complete signed capture, preserves the response, and safely retries without HTTP', async () => {
    const db = webhookFixture(flow);
    const handler = loadHandler('razorpay-webhook', db);
    const send = () => handler(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise));
    const response = await send();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ received: true, handled: true, orderId: 'order_fixture', paymentId: 'pay_fixture' }));
    expect(db.tables[flow.table][0][flow.status]).toBe(flow.paid);
    const writes = clone(db.writes);
    expect((await send()).status).toBe(200);
    expect(db.writes).toEqual(writes);
    expect(db.provider).not.toHaveBeenCalled();
  });

  it.each(invalidCaptures.filter(([, overrides]) => !('id' in overrides || 'order_id' in overrides)))('rejects signed capture with %s', async (_label, overrides) => {
    const db = webhookFixture(flow);
    const response = await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise, overrides));
    expect(response.status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it.each(['id', 'order_id'])('acknowledges but never settles an event missing %s', async (key) => {
    const db = webhookFixture(flow);
    const response = await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise, { [key]: undefined }));
    expect(response.status).toBe(200);
    expect((await response.json()).handled).toBe(false);
    expect(db.writes).toEqual([]);
  });

  it('rejects a different payment on an already settled order', async () => {
    const db = webhookFixture(flow);
    Object.assign(db.tables[flow.table][0], { [flow.status]: flow.paid, [flow.payment]: 'pay_original' });
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise))).status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it('rejects tampering after signing even when the capture fields match', async () => {
    const db = webhookFixture(flow);
    const original = webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise);
    const altered = new Request(original.url, { method: 'POST', headers: original.headers, body: `${await original.text()} ` });
    expect((await loadHandler('razorpay-webhook', db)(altered)).status).toBe(401);
    expect(db.writes).toEqual([]);
  });

  it('preserves signed failure handling without granting an entitlement', async () => {
    const db = webhookFixture(flow);
    expect((await loadHandler('razorpay-webhook', db)(webhookRequest('order_fixture', 'pay_fixture', flow.amountPaise, { status: 'failed', captured: false }, 'payment.failed'))).status).toBe(200);
    expect(db.tables[flow.table][0][flow.status]).not.toBe(flow.paid);
    expect(db.tables.wallet_transactions ?? []).toEqual([]);
  });
});

it.each(['amount', 'currency'])('rejects inconsistent token ledger %s in both settlement paths', async (column) => {
  for (const webhook of [false, true]) {
    const db = fixture(flows[3]);
    db.tables.custom_project_payments[0][column] = column === 'amount' ? 1 : 'USD';
    const handler = loadHandler(webhook ? 'razorpay-webhook' : flows[3].name, db);
    expect((await handler(webhook ? webhookRequest('order_fixture', 'pay_fixture', 100) : request(signed('requestId')))).status).toBe(400);
    expect(db.writes).toEqual([]);
  }
});
