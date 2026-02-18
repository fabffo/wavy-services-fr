import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/api-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Clock, MapPin, Target, Users, Book, Award } from "lucide-react";

const FormationDetail = () => {
  const { slug } = useParams();
  const [training, setTraining] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  useEffect(() => {
    fetchTraining();
  }, [slug]);

  const fetchTraining = async () => {
    const { data } = await supabase
      .from("trainings")
      .select("*, categories(name)")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    
    if (data) setTraining(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("training_leads").insert({
      ...formData,
      training_id: training.id
    });

    if (error) {
      toast.error("Erreur lors de l'envoi");
    } else {
      toast.success("Demande envoyée avec succès !");
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Formation introuvable</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link to="/formation" className="inline-flex items-center gap-2 text-secondary hover:underline mb-6">
          <ArrowLeft size={16} />
          Retour aux formations
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">{training.title}</h1>
                {training.featured && <Badge variant="secondary">⭐ À la une</Badge>}
              </div>
              {training.categories && (
                <Badge>{training.categories.name}</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {training.modality}
              </div>
              {training.duration_hours && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  {training.duration_hours}h
                </div>
              )}
            </div>

            {training.description_html && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Book size={24} />
                    Description
                  </h2>
                  <div dangerouslySetInnerHTML={{ __html: training.description_html }} />
                </CardContent>
              </Card>
            )}

            {training.goals_html && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Target size={24} />
                    Objectifs
                  </h2>
                  <div dangerouslySetInnerHTML={{ __html: training.goals_html }} />
                </CardContent>
              </Card>
            )}

            {training.program_html && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award size={24} />
                    Programme
                  </h2>
                  <div dangerouslySetInnerHTML={{ __html: training.program_html }} />
                </CardContent>
              </Card>
            )}

            {training.audience_html && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Users size={24} />
                    Public visé
                  </h2>
                  <div dangerouslySetInnerHTML={{ __html: training.audience_html }} />
                </CardContent>
              </Card>
            )}

            {training.prerequisites_html && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Prérequis</h2>
                  <div dangerouslySetInnerHTML={{ __html: training.prerequisites_html }} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {training.price && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">À partir de</p>
                    <p className="text-4xl font-bold text-secondary">{training.price}€</p>
                  </div>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Demander un devis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Demande de devis - {training.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Nom complet *</Label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Entreprise</Label>
                        <Input
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Décrivez votre besoin..."
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Envoyer ma demande
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FormationDetail;