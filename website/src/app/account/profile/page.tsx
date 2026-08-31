import { requireUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Profile</h1>
      <div className="mt-6 max-w-md">
        <ProfileForm initial={user} />
      </div>
    </div>
  );
}
