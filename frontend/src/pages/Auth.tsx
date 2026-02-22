import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import OTPVerification from "@/components/auth/OTPVerification";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const resetToken = new URLSearchParams(window.location.search).get("reset");

  useEffect(() => {
    // Redirect if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error("Erreur de connexion : " + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has a valid (used) OTP that hasn't expired yet
        const checkResponse = await supabase.functions.invoke('verify-otp', {
          body: { userId: data.user.id, checkOnly: true }
        });

        if (checkResponse.data?.alreadyVerified) {
          // User already verified within validity period, allow login
          toast.success("Connexion réussie !");
          navigate("/");
          return;
        }

        // Sign out - we need OTP verification first
        await supabase.auth.signOut();
        
        // Send OTP code
        const response = await supabase.functions.invoke('send-otp', {
          body: { email, userId: data.user.id }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        setPendingUserId(data.user.id);
        setShowOTPVerification(true);
        toast.success("Un code de vérification a été envoyé à votre email");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erreur lors de l'envoi du code de vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    // Re-authenticate after OTP verification
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error("Erreur de connexion : " + error.message);
        setShowOTPVerification(false);
        return;
      }

      toast.success("Connexion réussie !");
      navigate("/");
    } catch (error: any) {
      console.error("Re-auth error:", error);
      toast.error("Erreur lors de la connexion");
      setShowOTPVerification(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromOTP = () => {
    setShowOTPVerification(false);
    setPendingUserId(null);
    setPassword("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) {
      toast.error("Erreur d'inscription : " + error.message);
    } else {
      toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Un email de réinitialisation a été envoyé à " + email);
      setShowForgotPassword(false);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.post('/api/auth/reset-password-confirm', { token: resetToken, password: newPassword });
      toast.success("Mot de passe défini avec succès ! Vous pouvez maintenant vous connecter.");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-6">Définir mon mot de passe</h1>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enregistrement..." : "Définir mon mot de passe"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (showOTPVerification && pendingUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl">
          <OTPVerification
            email={email}
            userId={pendingUserId}
            onVerified={handleOTPVerified}
            onBack={handleBackFromOTP}
          />
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl">
          <button 
            onClick={() => setShowForgotPassword(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </button>
          
          <h1 className="text-2xl font-bold text-center mb-6">Mot de passe oublié</h1>
          <p className="text-muted-foreground text-center mb-6">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input 
                id="reset-email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="votre@email.com"
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Administration</h1>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input 
                  id="login-password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Mot de passe</Label>
                <Input 
                  id="signup-password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 caractères
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;