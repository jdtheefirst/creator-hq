import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import ProfileForm from "@/components/ProfileForm";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Fetch user data
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      redirect("/login");
    }

    // Fetch user role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user role:", userError);
      redirect("/login");
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      redirect("/login");
    }

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
                userId={session.user.id}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ProfilePage:", error);
    redirect("/login");
  }
}
