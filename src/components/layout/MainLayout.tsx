
import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavigation } from "./TopNavigation";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <TopNavigation />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
