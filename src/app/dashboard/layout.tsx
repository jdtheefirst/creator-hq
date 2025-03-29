import SignOutButton from "@/components/SignOutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Creator HQ</h1>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
