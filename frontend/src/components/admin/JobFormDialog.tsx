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

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: any;
  onSuccess: () => void;
}

const JobFormDialog = ({ open, onOpenChange, job, onSuccess }: JobFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: job?.title || "",
    slug: job?.slug || "",
    contract_type: job?.contract_type || "cdi",
    location: job?.location || "",
    domain: job?.domain || "",
    description_html: job?.description_html || "",
    requirements_html: job?.requirements_html || "",
    duties_html: job?.duties_html || "",
    salary_min: job?.salary_min || "",
    salary_max: job?.salary_max || "",
    status: job?.status || "draft",
    featured: job?.featured || false,
    priority: job?.priority || 0
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: job?.title || "",
        slug: job?.slug || "",
        contract_type: job?.contract_type || "cdi",
        location: job?.location || "",
        domain: job?.domain || "",
        description_html: job?.description_html || "",
        requirements_html: job?.requirements_html || "",
        duties_html: job?.duties_html || "",
        salary_min: job?.salary_min || "",
        salary_max: job?.salary_max || "",
        status: job?.status || "draft",
        featured: job?.featured || false,
        priority: job?.priority || 0
      });
    }
  }, [open, job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
      priority: parseInt(formData.priority.toString()),
      published_at: formData.status === "published" ? new Date().toISOString() : null
    };

    const { error } = job
      ? await supabase.from("jobs").update(data).eq("id", job.id)
      : await supabase.from("jobs").insert(data);

    setLoading(false);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(job ? "Offre mise à jour" : "Offre créée");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Type de contrat *</Label>
              <Select value={formData.contract_type} onValueChange={(v) => setFormData({ ...formData, contract_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cdi">CDI</SelectItem>
                  <SelectItem value="cdd">CDD</SelectItem>
                  <SelectItem value="interim">Intérim</SelectItem>
                  <SelectItem value="stage">Stage</SelectItem>
                  <SelectItem value="alternance">Alternance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Localisation *</Label>
              <Input
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Domaine</Label>
            <Input
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={formData.description_html}
              onChange={(e) => setFormData({ ...formData, description_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Missions</Label>
            <Textarea
              rows={4}
              value={formData.duties_html}
              onChange={(e) => setFormData({ ...formData, duties_html: e.target.value })}
            />
          </div>

          <div>
            <Label>Profil recherché</Label>
            <Textarea
              rows={4}
              value={formData.requirements_html}
              onChange={(e) => setFormData({ ...formData, requirements_html: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Salaire min (€/an)</Label>
              <Input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
              />
            </div>
            <div>
              <Label>Salaire max (€/an)</Label>
              <Input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
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
            <div>
              <Label>Priorité</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
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
              {loading ? "Enregistrement..." : job ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobFormDialog;