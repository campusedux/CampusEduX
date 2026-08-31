import { requireStaffUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { RewardSettingsForm } from '@/app/settings/RewardSettingsForm';
import { FeatureFlagRow } from '@/app/settings/FeatureFlagRow';
import { HomeSectionRow } from '@/app/settings/HomeSectionRow';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const staff = await requireStaffUser();
  const isAdmin = staff.roleId === 'admin' || staff.roleId === 'super_admin';

  if (!isAdmin) {
    return (
      <Card>
        <EmptyState title="Admins only" description="Only Admin and Super Admin accounts can change platform settings." />
      </Card>
    );
  }

  const supabase = createClient();
  const [{ data: rewardSettings }, { data: featureFlags }, { data: homeSections }] = await Promise.all([
    supabase.from('reward_settings').select('*').eq('id', 1).single(),
    supabase.from('feature_flags').select('*').order('key'),
    supabase.from('home_layout').select('*').order('sort_order'),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Platform-wide configuration — changes apply without an app release</p>
      </div>

      <Card>
        <CardHeader title="Referral rewards" description="Controls what every user sees on the Refer & Earn screen" />
        {rewardSettings ? (
          <RewardSettingsForm
            initialValues={{
              isEnabled: rewardSettings.is_enabled,
              rewardType: rewardSettings.reward_type,
              rewardAmount: Number(rewardSettings.reward_amount),
              minPurchase: Number(rewardSettings.min_purchase),
              perUserCap: rewardSettings.per_user_cap === null ? null : Number(rewardSettings.per_user_cap),
              validityDays: rewardSettings.validity_days,
            }}
          />
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Feature flags" description="Toggle features on/off, or roll out gradually by percentage" />
        {!featureFlags || featureFlags.length === 0 ? (
          <p className="text-sm text-ink-faint">No feature flags defined yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {featureFlags.map((flag) => (
              <FeatureFlagRow key={flag.key} flag={flag} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Home screen sections" description="Enable/disable and reorder the sections shown on the mobile home screen" />
        {!homeSections || homeSections.length === 0 ? (
          <p className="text-sm text-ink-faint">No home sections configured yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {homeSections.map((section) => (
              <HomeSectionRow key={section.section_key} section={section} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
