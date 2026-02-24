import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Briefcase, GraduationCap, Users, MessageSquare, BarChart, ClipboardList, Home } from "lucide-react";
import JobsManager from "@/components/admin/JobsManager";
import TrainingsManager from "@/components/admin/TrainingsManager";
import ApplicationsManager from "@/components/admin/ApplicationsManager";
import TrainingLeadsManager from "@/components/admin/TrainingLeadsManager";
import UsersManager from "@/components/admin/UsersManager";
import Dashboard from "@/components/admin/Dashboard";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Administration Wavy Services</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="bg-white/10 hover:bg-white/20 border-white text-white">
              <Home className="mr-2" size={16} />
              Site vitrine
            </Button>
            <Button variant="outline" onClick={handleLogout} className="bg-white/10 hover:bg-white/20 border-white text-white">
              <LogOut className="mr-2" size={16} />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">
              <BarChart className="mr-2" size={16} />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="mr-2" size={16} />
              Emplois
            </TabsTrigger>
            <TabsTrigger value="trainings">
              <GraduationCap className="mr-2" size={16} />
              Formations
            </TabsTrigger>
            <TabsTrigger value="applications">
              <Users className="mr-2" size={16} />
              Candidatures
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-2" size={16} />
              Messages
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2" size={16} />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="cra" onClick={() => navigate("/cra/dashboard")}>
              <ClipboardList className="mr-2" size={16} />
              CRA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsManager />
          </TabsContent>

          <TabsContent value="trainings">
            <TrainingsManager />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsManager />
          </TabsContent>

            <TabsContent value="messages">
              <TrainingLeadsManager />
            </TabsContent>
            <TabsContent value="users">
              <UsersManager />
            </TabsContent>
          </Tabs>
      </main>
    </div>
  );
};

export default Admin;