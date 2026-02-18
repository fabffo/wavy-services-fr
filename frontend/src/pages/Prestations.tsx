import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Prestations = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Prestations & Management de Transition</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Des experts opérationnels immédiatement disponibles
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Champs d'Intervention</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card p-6 rounded-lg border">
                <Globe className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Zone géographique</h3>
                <p className="text-muted-foreground">France et Europe</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <TrendingUp className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Domaines d'expertise</h3>
                <p className="text-muted-foreground">Manager ou expert dans les secteurs de l'IT / Finance / RH</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Nos Engagements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Option d'embauche en CDI",
                "Garantie de remplacement",
                "Tarifs négociés et valables toute l'année",
                "Envoi de profils sous 72h"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <p className="text-lg">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Nos Résultats</h2>
            <div className="bg-card p-8 rounded-lg border text-center max-w-2xl mx-auto">
              <p className="text-6xl font-bold text-secondary mb-4">97%</p>
              <p className="text-xl text-muted-foreground">Taux de satisfaction client à l'issue des missions</p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Besoin d'un manager de transition ?</h2>
            <Button size="lg" asChild>
              <Link to="/contact">Recevoir des CV rapidement</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Prestations;