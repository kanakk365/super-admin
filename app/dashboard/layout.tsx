import AuthGuard from "@/components/auth-guard";
import Sidebar from "../components/Sidebar";
import Header from "@/components/ui/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div>
        <Sidebar />
        <div className="lg:pl-56">
          <Header />
          <main className="">
            <div className="px-4 py-6 bg-gray-100">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
