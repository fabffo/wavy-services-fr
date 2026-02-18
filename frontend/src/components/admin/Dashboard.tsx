import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/api-client";
import { Briefcase, GraduationCap, Users, FileText } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    publishedJobs: 0,
    draftJobs: 0,
    publishedTrainings: 0,
    draftTrainings: 0,
    applications: 0,
    messages: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      { count: publishedJobs },
      { count: draftJobs },
      { count: publishedTrainings },
      { count: draftTrainings },
      { count: applications },
      { count: messages }
    ] = await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("trainings").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("trainings").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("applications").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*", { count: "exact", head: true })
    ]);

    setStats({
      publishedJobs: publishedJobs || 0,
      draftJobs: draftJobs || 0,
      publishedTrainings: publishedTrainings || 0,
      draftTrainings: draftTrainings || 0,
      applications: applications || 0,
      messages: messages || 0
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Tableau de Bord</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offres Publiées</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedJobs}</div>
            <p className="text-xs text-muted-foreground">{stats.draftJobs} brouillon(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations Publiées</CardTitle>
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedTrainings}</div>
            <p className="text-xs text-muted-foreground">{stats.draftTrainings} brouillon(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications}</div>
            <p className="text-xs text-muted-foreground">Total reçues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Contact</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">Messages reçus</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;