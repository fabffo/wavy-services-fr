import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import JobFormDialog from "./JobFormDialog";

const JobsManager = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Supprimer cette offre ?")) return;
    
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Offre supprimée");
      fetchJobs();
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    if (status === "draft") return "secondary";
    if (status === "archived") return "outline";
    return "default";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Gestion des Offres d'Emploi</h2>
        <Button onClick={() => { setEditingJob(null); setDialogOpen(true); }}>
          <Plus className="mr-2" size={16} />
          Nouvelle offre
        </Button>
      </div>

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editingJob}
        onSuccess={fetchJobs}
      />

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <Badge variant={getStatusVariant(job.status)}>
                      {job.status}
                    </Badge>
                    {job.featured && <Badge variant="secondary">⭐ Featured</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    {job.contract_type} • {job.location}
                    {job.domain && ` • ${job.domain}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créé le {new Date(job.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === "published" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/offres/${job.slug}`} target="_blank">
                        <Eye size={16} />
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setEditingJob(job); setDialogOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteJob(job.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune offre pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobsManager;