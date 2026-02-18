import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/api-client";
import { toast } from "sonner";

interface TrainingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: any;
  onSuccess: () => void;
}

const TrainingFormDialog = ({ open, onOpenChange, training, onSuccess }: TrainingFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: training?.title || "",
    slug: training?.slug || "",
    modality: training?.modality || "presentiel",
    category_id: training?.category_id || "",
    duration_hours: training?.duration_hours || "",
    price: training?.price || "",
    description_html: training?.description_html || "",
    goals_html: training?.goals_html || "",
    program_html: training?.program_html || "",
    prerequisites_html: training?.prerequisites_html || "",
    audience_html: training?.audience_html || "",
    status: training?.status || "draft",
    featured: training?.featured || false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "formation")
      .order("name");
    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
      price: formData.price ? parseFloat(formData.price) : null,
      category_id: formData.category_id || null,
      published_at: formData.status === "published" ? new Date().toISOString() : null
    };

    const { error } = training
      ? await supabase.from("trainings").update(data).eq("id", training.id)
      : await supabase.from("trainings").insert(data);

    setLoading(false);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(training ? "Formation mise à jour" : "Formation créée");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{training ? "Modifier la formation" : "Nouvelle formation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Titre *</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Modalité *</Label>
              <Select value={formData.modality} onValueChange={(v) => setFormData({ ...formData, modality: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                  <SelectItem value="distanciel">Distanciel</SelectItem>
                  <SelectItem value="hybride">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Durée (heures)</Label>
              <Input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
              />
            </div>
            <div>
              <Label>Prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Catégorie</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={formData.description_html}
              onChange={(e) => setFormData({ ...formData, description_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Objectifs</Label>
            <Textarea
              rows={3}
              value={formData.goals_html}
              onChange={(e) => setFormData({ ...formData, goals_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Programme</Label>
            <Textarea
              rows={4}
              value={formData.program_html}
              onChange={(e) => setFormData({ ...formData, program_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Prérequis</Label>
            <Textarea
              rows={2}
              value={formData.prerequisites_html}
              onChange={(e) => setFormData({ ...formData, prerequisites_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Public visé</Label>
            <Textarea
              rows={2}
              value={formData.audience_html}
              onChange={(e) => setFormData({ ...formData, audience_html: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label>À la une</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : training ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingFormDialog;