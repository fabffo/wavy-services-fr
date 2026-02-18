import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import logoWavy from "@/assets/logowavy.jpg";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <img src={logoWavy} alt="Wavy Services" className="h-12 w-auto mb-4" />
            <p className="opacity-90">
              Cabinet de conseil expert en recrutement, formation et conseil RH
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Nos Bureaux</h3>
            <div className="space-y-3 opacity-90">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Paris</p>
                  <p>8, rue Raymond Marcheron<br />92170 Vanves</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Biarritz</p>
                  <p>13, rue Larroze<br />64200 Biarritz</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 opacity-90">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <a href="tel:0695832304" className="hover:text-secondary transition-colors">
                  06 95 83 23 04
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <Link to="/contact" className="hover:text-secondary transition-colors">
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="opacity-75">&copy; {new Date().getFullYear()} Wavy Services. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link to="/mentions-legales" className="opacity-75 hover:opacity-100 hover:text-secondary transition-colors">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="opacity-75 hover:opacity-100 hover:text-secondary transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;