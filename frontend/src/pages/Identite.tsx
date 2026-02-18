import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/api-client";

const Identite = () => {
  const [pageContent, setPageContent] = useState<any>(null);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("key", "identity")
      .single();
    if (data) setPageContent(data);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Identité</h1>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold mb-6">Qui sommes-nous ?</h2>
              
              <div className="grid md:grid-cols-2 gap-8 my-8">
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 text-secondary">Cabinet de Recrutement</h3>
                  <p className="text-muted-foreground">
                    Experts en identification et sélection des meilleurs talents pour votre entreprise
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 text-secondary">Prestataire de Services</h3>
                  <p className="text-muted-foreground">
                    Management de transition et prestations IT, Finance et RH
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 text-secondary">Centre de Formation</h3>
                  <p className="text-muted-foreground">
                    Formations certifiées Qualiopi pour le développement des compétences
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 text-secondary">Bilans de Compétences</h3>
                  <p className="text-muted-foreground">
                    Accompagnement personnalisé dans votre évolution professionnelle
                  </p>
                </div>
              </div>

              <div className="bg-muted p-8 rounded-lg my-8">
                <p className="text-xl font-medium mb-4">
                  Nous travaillons sur l'emploi et les compétences.
                </p>
                <p className="text-lg text-muted-foreground">
                  Tout ce que nous faisons, c'est avec l'envie de vous accompagner le plus loin 
                  et le plus longtemps possible.
                </p>
              </div>

              {pageContent?.content_html && (
                <div 
                  dangerouslySetInnerHTML={{ __html: pageContent.content_html }}
                  className="my-8"
                />
              )}

              <h2 className="text-3xl font-bold mb-6 mt-12">Nos Valeurs</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Excellence", desc: "Nous visons l'excellence dans chaque mission" },
                  { title: "Engagement", desc: "Nous nous engageons pleinement à vos côtés" },
                  { title: "Proximité", desc: "Nous privilégions l'écoute et la relation humaine" }
                ].map((value, i) => (
                  <div key={i} className="text-center p-6">
                    <h3 className="text-xl font-semibold mb-3 text-secondary">{value.title}</h3>
                    <p className="text-muted-foreground">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Identite;