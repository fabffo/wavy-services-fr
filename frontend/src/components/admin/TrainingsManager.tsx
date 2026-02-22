import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import TrainingFormDialog from "./TrainingFormDialog";

const TrainingsManager = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    const data = await supabase.get('/api/trainings');
    if (data) setTrainings(data);
  };

  const deleteTraining = async (id: string) => {
    if (!confirm("Supprimer cette formation ?")) return;
    
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Formation supprimée");
      fetchTrainings();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Gestion des Formations</h2>
        <Button onClick={() => { setEditingTraining(null); setDialogOpen(true); }}>
          <Plus className="mr-2" size={16} />
          Nouvelle formation
        </Button>
      </div>

      <TrainingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        training={editingTraining}
        onSuccess={fetchTrainings}
      />

      <div className="grid gap-4">
        {trainings.map((training) => (
          <Card key={training.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{training.title}</h3>
                    <Badge>{training.status}</Badge>
                    {training.featured && <Badge variant="secondary">⭐ Featured</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    {training.modality} 
                    {training.duration_hours && ` • ${training.duration_hours}h`}
                    {training.category_name && ` • ${training.category_name}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créé le {new Date(training.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingTraining(training); setDialogOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteTraining(training.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trainings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune formation pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingsManager;