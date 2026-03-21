import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppSidebar />
      <main className="flex flex-col flex-1 lg:ml-[280px] pt-14 lg:pt-0">
        <div className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </div>
        <footer className="safety-banner mt-auto">
          MedExplain AI provides information, not a diagnosis. Your doctor remains your primary source of medical truth.
        </footer>
      </main>
    </div>
  );
}
