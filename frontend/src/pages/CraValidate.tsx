import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type ValidationStatus = "loading" | "approved" | "rejected" | "error" | "already_processed";

export default function CraValidate() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ValidationStatus>("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{ month?: string; clientName?: string }>({});
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      setStatus("error");
      setMessage("Lien de validation invalide. Paramètres manquants.");
      return;
    }

    if (action !== "approve" && action !== "reject") {
      setStatus("error");
      setMessage("Action invalide.");
      return;
    }

    validateCra(token, action as "approve" | "reject");
  }, [searchParams]);

  const validateCra = async (token: string, action: "approve" | "reject") => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-cra", {
        body: { token, action },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setStatus(action === "approve" ? "approved" : "rejected");
        setMessage(data.message);
        setDetails({ month: data.month, clientName: data.clientName });
      } else {
        if (data.status === "approved" || data.status === "rejected") {
          setStatus("already_processed");
        } else {
          setStatus("error");
        }
        setMessage(data.message || data.error);
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      setStatus("error");
      setMessage(error.message || "Une erreur s'est produite lors de la validation.");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Validation en cours...</h2>
            <p className="text-muted-foreground mt-2">Veuillez patienter</p>
          </div>
        );

      case "approved":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">CRA Approuvé</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            {details.month && (
              <p className="text-sm text-muted-foreground">
                Période : {details.month}
              </p>
            )}
          </div>
        );

      case "rejected":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">CRA Rejeté</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            {details.month && (
              <p className="text-sm text-muted-foreground">
                Période : {details.month}
              </p>
            )}
          </div>
        );

      case "already_processed":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Déjà traité</h2>
            <p className="text-muted-foreground">{message}</p>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
            <p className="text-muted-foreground">{message}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-muted-foreground">Wavy Services</h1>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
