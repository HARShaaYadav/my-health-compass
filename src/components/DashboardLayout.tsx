import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-[280px] pt-14 lg:pt-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
        <footer className="safety-banner">
          MedExplain AI provides information, not a diagnosis. Your doctor remains your primary source of medical truth.
        </footer>
      </main>
    </div>
  );
}
