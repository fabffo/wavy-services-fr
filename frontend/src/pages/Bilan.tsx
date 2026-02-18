import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Bilan = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Bilan de Compétences</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Un accompagnement personnalisé pour votre évolution professionnelle
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Les 3 Phases du Bilan</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Phase Préliminaire</h3>
                <p className="text-muted-foreground">
                  Analyse de la demande, information sur les conditions de déroulement et définition des objectifs
                </p>
              </div>

              <div className="text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Phase d'Investigation</h3>
                <p className="text-muted-foreground">
                  Analyse du parcours, identification des compétences et exploration des possibilités d'évolution
                </p>
              </div>

              <div className="text-center p-6 bg-card rounded-lg border">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Phase de Conclusion</h3>
                <p className="text-muted-foreground">
                  Élaboration d'un projet professionnel réaliste et plan d'action détaillé
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Modalités Pratiques</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-card p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Durée & Format</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>24 heures sur 3 mois maximum</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Séances en présentiel ou distanciel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Planning flexible et adapté</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Financement</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>CPF (Compte Personnel de Formation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Plan de développement des compétences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>Financement personnel</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Pourquoi Faire un Bilan ?</h2>
              <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
                {[
                  "Faire le point sur votre parcours professionnel",
                  "Identifier vos compétences et aptitudes",
                  "Définir un projet professionnel réaliste",
                  "Préparer une reconversion ou une évolution",
                  "Retrouver confiance et motivation",
                  "Être accompagné par un expert certifié"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-secondary text-secondary-foreground text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Prêt à démarrer votre bilan ?</h2>
            <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/contact">Demander un entretien</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Bilan;