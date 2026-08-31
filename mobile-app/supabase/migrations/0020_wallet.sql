-- Fixes: GET /rest/v1/wallet_transactions -> 404 PGRST205
--        "Could not find the table 'public.wallet_transactions' in the schema cache"
--
-- src/services/wallet.service.ts:
--   getWalletSummary() / getAllTransactions():
--     wallet_transactions.select("*").eq("user_id", uid).order("created_at", desc)
--     -> NOTE the client sums EVERY row it gets back (no status filter), so a
--        pending top-up must NOT live here. Pending Razorpay top-ups sit in
--        wallet_topup_orders and only become a wallet_transactions row once
--        verify-wallet-topup-payment has checked the signature.
--   requestWithdrawal(): wallet_transactions.insert { user_id, type:'debit',
--                          category:'withdrawal', amount, description }
--   mapTransactionRow(): id, type, category, amount, description, created_at
--   supabase/functions/create-wallet-topup-order / verify-wallet-topup-payment
--     own wallet_topup_orders and insert the settled credit row.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.wallet_transactions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  type        text        not null check (type in ('credit', 'debit')),
  category    text        not null check (category in (
                'referral_bonus', 'added_money', 'project_purchase',
                'mock_test_purchase', 'cashback', 'withdrawal')),
  amount      numeric(10,2) not null check (amount >= 0),
  description text        not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists wallet_transactions_user_id_idx
  on public.wallet_transactions (user_id, created_at desc);

create table if not exists public.wallet_topup_orders (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles (id) on delete cascade,
  amount              numeric(10,2) not null check (amount > 0),
  currency            text        not null default 'INR',
  status              text        not null default 'created'
                        check (status in ('created', 'paid', 'failed')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists wallet_topup_orders_razorpay_order_id_key
  on public.wallet_topup_orders (razorpay_order_id) where razorpay_order_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   wallet_transactions: a user reads their own ledger and may insert a
--     'withdrawal' debit (requestWithdrawal). Credits are inserted by the
--     Edge Functions via the service role, so the INSERT policy restricts the
--     client to debits only.
--   wallet_topup_orders: read own; all writes are service-role (Edge Function).
-- ---------------------------------------------------------------------------
alter table public.wallet_transactions enable row level security;
alter table public.wallet_topup_orders enable row level security;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "wallet_transactions_insert_own_debit" on public.wallet_transactions;
create policy "wallet_transactions_insert_own_debit"
  on public.wallet_transactions for insert
  with check (auth.uid() = user_id and type = 'debit' and category = 'withdrawal');

drop policy if exists "wallet_topup_orders_select_own" on public.wallet_topup_orders;
create policy "wallet_topup_orders_select_own"
  on public.wallet_topup_orders for select
  using (auth.uid() = user_id);

drop trigger if exists wallet_topup_orders_set_updated_at on public.wallet_topup_orders;
create trigger wallet_topup_orders_set_updated_at
  before update on public.wallet_topup_orders
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
