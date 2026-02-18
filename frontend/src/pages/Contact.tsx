import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/api-client";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    gdprConsent: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) {
      toast.error("Veuillez accepter la politique de confidentialité");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        gdpr_consent: formData.gdprConsent
      });

      if (error) throw error;

      toast.success("Message envoyé avec succès !");
      setFormData({ name: "", email: "", subject: "", message: "", gdprConsent: false });
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-6">Contact</h1>
            <p className="text-xl max-w-2xl opacity-90">
              Parlons de votre projet ensemble
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-8">Nos Coordonnées</h2>
                
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Paris</h3>
                          <p className="text-muted-foreground">
                            8, rue Raymond Marcheron<br />
                            92170 Vanves
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Biarritz</h3>
                          <p className="text-muted-foreground">
                            13, rue Larroze<br />
                            64200 Biarritz
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Phone className="w-6 h-6 text-secondary" />
                        <div>
                          <a href="tel:0695832304" className="text-lg font-semibold hover:text-secondary transition-colors">
                            06 95 83 23 04
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-8">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label htmlFor="subject">Sujet *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="gdpr"
                      checked={formData.gdprConsent}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, gdprConsent: checked as boolean })
                      }
                    />
                    <Label htmlFor="gdpr" className="text-sm cursor-pointer">
                      J'accepte que mes données soient utilisées pour répondre à ma demande. 
                      Voir notre <a href="/confidentialite" className="text-secondary underline">politique de confidentialité</a>.
                    </Label>
                  </div>

                  <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le message"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;