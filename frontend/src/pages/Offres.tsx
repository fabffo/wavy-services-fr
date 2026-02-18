import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { Search, MapPin, Briefcase } from "lucide-react";

const Offres = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("priority", { ascending: false })
      .order("published_at", { ascending: false });
    if (data) setJobs(data);
  };

  const uniqueLocations = [...new Set(jobs.map(job => job.location))];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContract = selectedContract === "all" || job.contract_type === selectedContract;
    const matchesLocation = selectedLocation === "all" || job.location === selectedLocation;
    return matchesSearch && matchesContract && matchesLocation;
  });

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
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Offres d'Emploi</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Découvrez nos opportunités de carrière
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <Input
                  placeholder="Rechercher par titre ou domaine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Type de contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les contrats</SelectItem>
                  <SelectItem value="cdi">CDI</SelectItem>
                  <SelectItem value="cdd">CDD</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="stage">Stage</SelectItem>
                  <SelectItem value="alternance">Alternance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Localisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les localisations</SelectItem>
                  {uniqueLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      {job.featured && (
                        <Badge variant="secondary" className="ml-2">⭐ À la une</Badge>
                      )}
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} />
                        <span>{contractLabels[job.contract_type]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{job.location}</span>
                      </div>
                      {job.domain && (
                        <Badge variant="outline" className="mt-2">{job.domain}</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {job.salary_min && job.salary_max && (
                      <p className="text-sm text-muted-foreground mb-4">
                        💰 {job.salary_min}€ - {job.salary_max}€
                      </p>
                    )}
                    <Button className="w-full" asChild>
                      <Link to={`/offres/${job.slug}`}>Voir l'offre</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  Aucune offre ne correspond à vos critères
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedContract("all");
                  setSelectedLocation("all");
                }}>
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Offres;