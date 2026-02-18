import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";

interface OTPVerificationProps {
  email: string;
  userId: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification = ({ email, userId, onVerified, onBack }: OTPVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Veuillez entrer le code à 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { userId, code }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.valid) {
        toast.success("Vérification réussie !");
        onVerified();
      } else {
        toast.error(response.data?.error || "Code invalide ou expiré");
        setCode("");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error("Erreur lors de la vérification");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { email, userId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Nouveau code envoyé !");
      setCountdown(60);
      setCode("");
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Vérification par email</h2>
        <p className="text-muted-foreground">
          Un code à 6 chiffres a été envoyé à<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={handleVerify}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={loading || code.length !== 6}
      >
        {loading ? "Vérification..." : "Vérifier le code"}
      </Button>

      <div className="text-center">
        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
          {countdown > 0
            ? `Renvoyer dans ${countdown}s`
            : resending
              ? "Envoi..."
              : "Renvoyer le code"
          }
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Le code est valide pendant 6 mois
      </p>
    </div>
  );
};

export default OTPVerification;
