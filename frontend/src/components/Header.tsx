import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logoWavy from "@/assets/logowavy.jpg";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCraUser, setIsCraUser] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRoles(session.user.id);
      } else {
        setIsAdmin(false);
        setIsCraUser(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      checkRoles(session.user.id);
    }
  };

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsCraUser(roles.includes("user_cra"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  const navItems = [
    { label: "Accueil", path: "/" },
    { label: "Identité", path: "/identite" },
    { label: "Recrutement", path: "/recrutement" },
    { label: "Prestations", path: "/prestations" },
    { label: "Formation", path: "/formation" },
    { label: "Bilan", path: "/bilan" },
    { label: "Offres", path: "/offres" },
    { label: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <img src={logoWavy} alt="Wavy Services" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-2 ml-2">
                {isCraUser && (
                  <Link to="/cra/dashboard">
                    <Button variant="secondary" size="sm">
                      <User className="mr-2" size={16} />
                      Espace Prestataire
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm">
                      <User className="mr-2" size={16} />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="bg-white/10 hover:bg-white/20 border-white text-white">
                  <LogOut className="mr-2" size={16} />
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="ml-2">
                <Button variant="secondary" size="sm">
                  <User className="mr-2" size={16} />
                  Connexion
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="lg:hidden pb-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {isCraUser && (
                  <Link to="/cra/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      <User className="mr-2" size={16} />
                      Espace Prestataire
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      <User className="mr-2" size={16} />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full bg-white/10 hover:bg-white/20 border-white text-white">
                  <LogOut className="mr-2" size={16} />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  <User className="mr-2" size={16} />
                  Connexion
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;