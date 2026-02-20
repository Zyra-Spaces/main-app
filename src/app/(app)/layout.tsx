import { AppSidebar } from "@/components/layout/app-sidebar";
import { RightPanel } from "@/components/layout/right-panel";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-background overflow-hidden px-6 md:px-12 lg:px-[100px]">
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden min-w-0">
        <AppSidebar />
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          {children}
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
