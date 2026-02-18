import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Recrutement = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Recrutement</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Un recrutement réussi, c'est une personnalité qui s'intègre à une culture d'entreprise
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Notre Vision</h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Un recrutement réussi c'est une personnalité qui s'intègre à une culture d'entreprise et un collectif 
              tout en apportant les compétences recherchées.
            </p>
          </div>
        </section>

        {/* Méthode */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Notre Méthode</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-lg">
                <Users className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Pour la recherche</h3>
                <p className="text-muted-foreground">
                  Un réseau de contacts nationaux et internationaux, de la chasse et des annonces 
                  sur les principales plateformes.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <CheckCircle className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Pour les entretiens</h3>
                <p className="text-muted-foreground">
                  Un entretien technique pour valider les capacités métier et un échange avec un expert RH 
                  pour l'aspect personnalité et caractère.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Engagements */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Nos Engagements</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: CheckCircle, text: "Garantie de remplacement" },
                { icon: TrendingUp, text: "Tarif concurrentiel et dégressif à partir de 4 recrutements par an" },
                { icon: Clock, text: "Démarrage des recherches sous 24 heures" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Résultats */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Nos Résultats</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-lg">
                <p className="text-muted-foreground mb-2">Principaux postes pourvus :</p>
                <p className="font-semibold">Manager IT, Développeur, Chef de projet, Responsable finance, Expert métier</p>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <p className="text-5xl font-bold text-secondary mb-2">85%</p>
                <p className="text-muted-foreground">Taux de candidats validant leur période d'essai</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-background text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Besoin de recruter ?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/offres">Voir nos offres</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Recrutement;