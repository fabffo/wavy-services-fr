import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/api-client";
import { ArrowLeft, Briefcase, MapPin, Calendar } from "lucide-react";
import CandidatureForm from "@/components/CandidatureForm";

const OffreDetail = () => {
  const { slug } = useParams();
  const [job, setJob] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (slug) fetchJob();
  }, [slug]);

  const fetchJob = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (data) setJob(data);
  };

  if (!job) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  const contractLabels: Record<string, string> = {
    cdi: "CDI",
    cdd: "CDD",
    freelance: "Freelance",
    stage: "Stage",
    alternance: "Alternance"
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/offres"><ArrowLeft className="mr-2" size={16} />Retour aux offres</Link>
          </Button>

          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-4xl font-bold">{job.title}</h1>
                  {job.featured && <Badge variant="secondary">⭐ À la une</Badge>}
                </div>
                
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} />
                    <span>{contractLabels[job.contract_type]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{job.location}</span>
                  </div>
                  {job.published_at && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      <span>Publié le {new Date(job.published_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {job.domain && <Badge variant="outline" className="mb-4">{job.domain}</Badge>}
                
                {job.salary_min && job.salary_max && (
                  <p className="text-lg font-semibold text-secondary mb-6">
                    💰 Salaire : {job.salary_min}€ - {job.salary_max}€
                  </p>
                )}
              </div>

              {job.description_html && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Description du poste</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description_html }} />
                </div>
              )}

              {job.duties_html && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Missions</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.duties_html }} />
                </div>
              )}

              {job.requirements_html && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Profil recherché</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.requirements_html }} />
                </div>
              )}

              <div className="mt-8 pt-6 border-t">
                {!showForm ? (
                  <Button size="lg" onClick={() => setShowForm(true)} className="w-full md:w-auto">
                    Postuler à cette offre
                  </Button>
                ) : (
                  <CandidatureForm jobId={job.id} jobTitle={job.title} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OffreDetail;