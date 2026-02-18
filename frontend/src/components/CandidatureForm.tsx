import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { supabase } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CandidatureFormProps {
  jobId: string;
  jobTitle: string;
}

const CandidatureForm = ({ jobId, jobTitle }: CandidatureFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let cvUrl = null;

      // Upload CV if provided
      if (cvFile) {
        const fileName = `${Date.now()}-${cvFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(fileName, cvFile);

        if (uploadError) throw new Error("Erreur lors de l'upload du CV");

        cvUrl = fileName;
      }

      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          cv_url: cvUrl
        });

      if (error) throw error;

      toast.success("Candidature envoyée avec succès !");
      setFormData({ name: "", email: "", phone: "", message: "" });
      setCvFile(null);
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted p-6 rounded-lg">
      <h3 className="text-2xl font-bold mb-4">Postuler : {jobTitle}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="cv">CV (PDF, DOC, DOCX)</Label>
          <Input
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <Label htmlFor="message">Message de motivation</Label>
          <Textarea
            id="message"
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Parlez-nous de votre motivation..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          * Champs obligatoires
        </div>
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              Envoi en cours...
            </>
          ) : (
            "Envoyer ma candidature"
          )}
        </Button>
      </form>
    </div>
  );
};

export default CandidatureForm;