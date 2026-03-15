import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "./components/DashboardLayout";
import HomePage from "./pages/HomePage";
import PrescriptionPage from "./pages/PrescriptionPage";
import MedicalReportPage from "./pages/MedicalReportPage";
import SymptomCheckerPage from "./pages/SymptomCheckerPage";
import AIChatPage from "./pages/AIChatPage";
import RemindersPage from "./pages/RemindersPage";
import HealthHistoryPage from "./pages/HealthHistoryPage";
import ConsultationPage from "./pages/ConsultationPage";
import InsurancePage from "./pages/InsurancePage";
import EmergencyPage from "./pages/EmergencyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
            <Route path="/report" element={<MedicalReportPage />} />
            <Route path="/symptoms" element={<SymptomCheckerPage />} />
            <Route path="/chat" element={<AIChatPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/history" element={<HealthHistoryPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/insurance" element={<InsurancePage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
