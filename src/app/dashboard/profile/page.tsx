import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Fetch user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isCreator = userData?.role === "creator";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
            <ProfileForm
              initialData={profile}
              isCreator={isCreator}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
