import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { Search, Award, Users, Target } from "lucide-react";

const Formation = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchTrainings();
    fetchCategories();
  }, []);

  const fetchTrainings = async () => {
    const { data } = await supabase
      .from("trainings")
      .select("*, categories(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (data) setTrainings(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "training");
    if (data) setCategories(data);
  };

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || training.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Formation</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Un centre certifié Qualiopi pour accompagner votre développement
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Notre Vision</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mb-8">
              La formation est un outil au service de la stratégie de l'entreprise et du développement des salariés. 
              Nous nous rendons là où vous en avez besoin pour faciliter la montée en compétence avec des durées 
              adaptées aux métiers de vos équipes.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <Award className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Certifié Qualiopi</h3>
                <p className="text-muted-foreground">Depuis sa création</p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Formateurs Experts</h3>
                <p className="text-muted-foreground">Expérience terrain et pédagogie</p>
              </div>
              <div className="text-center">
                <Target className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sur-Mesure</h3>
                <p className="text-muted-foreground">Adaptées à vos besoins</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Notre Catalogue</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:w-64">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainings.map((training) => (
                <Card key={training.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{training.title}</CardTitle>
                    <CardDescription>
                      {training.modality === "distanciel" ? "🌐 Distanciel" : 
                       training.modality === "presentiel" ? "📍 Présentiel" : "🔄 Hybride"}
                      {training.duration_hours && ` • ${training.duration_hours}h`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div dangerouslySetInnerHTML={{ __html: training.description_html?.substring(0, 150) + "..." }} className="mb-4 text-sm text-muted-foreground" />
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/formation/${training.slug}`}>En savoir plus</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTrainings.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Aucune formation ne correspond à vos critères
              </p>
            )}
          </div>
        </section>

        <section className="py-16 bg-background text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Besoin d'une formation sur-mesure ?</h2>
            <Button size="lg" asChild>
              <Link to="/contact">Contactez-nous</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Formation;