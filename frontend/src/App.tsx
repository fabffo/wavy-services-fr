import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Identite from "./pages/Identite";
import Recrutement from "./pages/Recrutement";
import Prestations from "./pages/Prestations";
import Formation from "./pages/Formation";
import Bilan from "./pages/Bilan";
import Offres from "./pages/Offres";
import OffreDetail from "./pages/OffreDetail";
import FormationDetail from "./pages/FormationDetail";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import CraDashboard from "./pages/CraDashboard";
import CraAuth from "./pages/CraAuth";
import CraValidate from "./pages/CraValidate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/identite" element={<Identite />} />
          <Route path="/recrutement" element={<Recrutement />} />
          <Route path="/prestations" element={<Prestations />} />
          <Route path="/formation" element={<Formation />} />
          <Route path="/bilan" element={<Bilan />} />
          <Route path="/offres" element={<Offres />} />
          <Route path="/offres/:slug" element={<OffreDetail />} />
          <Route path="/formation/:slug" element={<FormationDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cra/dashboard" element={<CraDashboard />} />
          <Route path="/cra/auth" element={<CraAuth />} />
          <Route path="/cra/validate" element={<CraValidate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
