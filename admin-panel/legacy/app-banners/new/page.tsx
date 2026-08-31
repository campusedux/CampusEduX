import { Card, CardHeader } from '@/components/ui/primitives';
import { BannerForm } from '@/app/banners/BannerForm';

export default function NewBannerPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New banner</h1>
      </div>
      <Card>
        <CardHeader title="Details" />
        <BannerForm />
      </Card>
    </div>
  );
}
