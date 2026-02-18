import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/api-client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CraSidebar } from "@/components/cra/CraSidebar";
import { CraUserDashboard } from "@/components/cra/CraUserDashboard";
import { CraAdminDashboard } from "@/components/cra/CraAdminDashboard";
import { CraClientsManager } from "@/components/cra/CraClientsManager";
import { CraUsersManager } from "@/components/cra/CraUsersManager";
import { toast } from "sonner";

export type CraView = "dashboard" | "my-cra" | "all-cra" | "clients" | "users";

const CraDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"admin" | "user_cra" | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<CraView>("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/cra/auth");
      return;
    }

    setUser(session.user);

    // Check roles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roleData || roleData.length === 0) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }

    const roles = roleData.map(r => r.role);
    
    if (roles.includes("admin")) {
      setUserRole("admin");
    } else if (roles.includes("user_cra")) {
      setUserRole("user_cra");
    } else {
      toast.error("Accès non autorisé à l'espace CRA");
      navigate("/");
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/cra/auth");
    toast.success("Déconnexion réussie");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!userRole) return null;

  const renderContent = () => {
    if (userRole === "user_cra") {
      return <CraUserDashboard userId={user.id} />;
    }

    switch (currentView) {
      case "dashboard":
      case "all-cra":
        return <CraAdminDashboard />;
      case "clients":
        return <CraClientsManager />;
      case "users":
        return <CraUsersManager />;
      default:
        return <CraAdminDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CraSidebar 
          userRole={userRole} 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onLogout={handleLogout}
          userEmail={user?.email}
        />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b flex items-center px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">
              Espace Rapport d'Activité (CRA)
            </h1>
          </header>
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CraDashboard;