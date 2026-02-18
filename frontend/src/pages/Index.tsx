import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, GraduationCap, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import videoWavy from "@/assets/video-ws-vague.mp4";

const Index = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section with Video Background */}
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
          {/* Video Background */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoWavy} type="video/mp4" />
          </video>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-primary/70"></div>
          
          {/* Content */}
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                Réinventons les organisations, ensemble.
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Expert en recrutement, formation et conseil RH
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg" asChild>
                  <Link to="/identite">Découvrir Wavy Services <ArrowRight className="ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 border-white text-white" asChild>
                  <Link to="/offres">Voir nos offres</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">Nos Activités</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Briefcase, title: "Recrutement", desc: "Solutions de recrutement sur-mesure", link: "/recrutement" },
                { icon: Users, title: "Prestations", desc: "Management de transition", link: "/prestations" },
                { icon: GraduationCap, title: "Formation", desc: "Centre certifié Qualiopi", link: "/formation" },
                { icon: TrendingUp, title: "Bilan", desc: "Bilan de compétences", link: "/bilan" }
              ].map((service, i) => (
                <Link key={i} to={service.link} className="group p-6 border rounded-lg hover:shadow-xl transition-all hover:border-secondary">
                  <service.icon className="w-12 h-12 text-secondary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-secondary mb-2">85%</div>
                <p className="text-lg">Période d'essai validée</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-secondary mb-2">97%</div>
                <p className="text-lg">Satisfaction client</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-secondary mb-2">&lt;72h</div>
                <p className="text-lg">Démarrage des missions</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Index;