-- SEC-01 rollback. PREPARED ONLY; separate approval required. Does not undo payments.
-- Roll back Edge Function code separately. Removes enforcement, so restore a
-- reviewed replacement before allowing verification traffic again.
-- Preserve internal claims as replay tombstones; never DROP financial data.
drop trigger if exists a_sec01_razorpay_binding on public.purchases;
drop trigger if exists a_sec01_razorpay_binding on public.wallet_topup_orders;
drop trigger if exists a_sec01_razorpay_binding on public.premium_subscriptions;
drop trigger if exists a_sec01_razorpay_binding on public.custom_project_requests;
drop trigger if exists a_sec01_razorpay_binding on public.custom_project_payments;
drop function if exists public.guard_razorpay_binding();
drop function if exists public._claim_razorpay_binding(text,uuid,text,text);
drop index if exists public.purchases_sec01_payment_idx;
drop index if exists public.wallet_sec01_payment_idx;
drop index if exists public.premium_sec01_payment_idx;
drop index if exists public.custom_request_sec01_payment_idx;
drop index if exists public.custom_payment_sec01_payment_idx;
-- Both internal tables retain RLS and revoked privileges.
notify pgrst, 'reload schema';
