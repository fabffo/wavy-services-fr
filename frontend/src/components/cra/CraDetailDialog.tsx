import { useState } from "react";
import { supabase } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Edit, Send, Mail, Loader2 } from "lucide-react";
import { CraFormDialog } from "./CraFormDialog";

interface CraDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cra: any;
  isAdmin: boolean;
  onUpdate: () => void;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const clientValidationLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Non envoyé", variant: "secondary" },
  sent: { label: "En attente", variant: "default" },
  approved: { label: "Validé par client", variant: "outline" },
  rejected: { label: "Rejeté par client", variant: "destructive" },
};

export function CraDetailDialog({ open, onOpenChange, cra, isAdmin, onUpdate }: CraDetailDialogProps) {
  const [adminComment, setAdminComment] = useState(cra.admin_comment || "");
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sendingValidation, setSendingValidation] = useState(false);
  const [clientEmailInput, setClientEmailInput] = useState(cra.client_email || "");

  const status = statusLabels[cra.status] || statusLabels.draft;
  const clientValidation = clientValidationLabels[cra.client_validation_status] || clientValidationLabels.pending;
  const monthDate = new Date(cra.month + "-01");
  const canEdit = cra.status === "draft" && !isAdmin;
  const canSendValidation = cra.status === "submitted" && (!cra.client_validation_status || cra.client_validation_status === "pending" || cra.client_validation_status === "sent");

  const handleStatusChange = async (newStatus: "approved" | "rejected") => {
    setLoading(true);

    const { error } = await supabase
      .from("cra_reports")
      .update({
        status: newStatus,
        admin_comment: adminComment,
      })
      .eq("id", cra.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(newStatus === "approved" ? "CRA approuvé" : "CRA rejeté");
      onUpdate();
    }

    setLoading(false);
  };

  const handleSendValidation = async () => {
    if (!clientEmailInput || !clientEmailInput.includes("@")) {
      toast.error("Veuillez saisir une adresse email valide");
      return;
    }

    setSendingValidation(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-cra-validation", {
        body: { craId: cra.id, clientEmail: clientEmailInput },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Email de validation envoyé au client");
      onUpdate();
    } catch (error: any) {
      console.error("Error sending validation:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    }

    setSendingValidation(false);
  };

  return (
    <>
      <Dialog open={open && !showEditDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                CRA - {format(monthDate, "MMMM yyyy", { locale: fr })}
              </DialogTitle>
              <div className="flex gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Société</Label>
                <p className="font-medium">{cra.company_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">{cra.clients?.name}</p>
              </div>
              {isAdmin && cra.profiles && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Utilisateur</Label>
                    <p className="font-medium">{cra.profiles.full_name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{cra.profiles.email}</p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <Label className="text-green-700">Jours travaillés</Label>
                <p className="text-2xl font-bold text-green-700">{cra.worked_days}</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <Label className="text-orange-700">Jours d'absence</Label>
                <p className="text-2xl font-bold text-orange-700">{cra.absent_days}</p>
              </div>
            </div>

            {cra.monthly_comment && (
              <div>
                <Label className="text-muted-foreground">Commentaires du mois</Label>
                <p className="mt-1 p-3 rounded-lg bg-muted">{cra.monthly_comment}</p>
              </div>
            )}

            {/* Client validation section */}
            {cra.status === "submitted" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Validation client</Label>
                    <Badge variant={clientValidation.variant}>{clientValidation.label}</Badge>
                  </div>
                  
                  {cra.validated_at && (
                    <p className="text-sm text-muted-foreground">
                      Validé le {format(new Date(cra.validated_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}

                  {canSendValidation && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="client-email">Email du client</Label>
                        <Input
                          id="client-email"
                          type="email"
                          value={clientEmailInput}
                          onChange={(e) => setClientEmailInput(e.target.value)}
                          placeholder="client@entreprise.com"
                        />
                      </div>
                      <Button
                        onClick={handleSendValidation}
                        disabled={sendingValidation || !clientEmailInput}
                        className="shrink-0"
                      >
                        {sendingValidation ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {cra.client_validation_status === "sent" ? "Renvoyer" : "Envoyer pour validation"}
                      </Button>
                    </div>
                  )}

                  {cra.client_email && cra.client_validation_status === "sent" && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email envoyé à : {cra.client_email}
                    </p>
                  )}
                </div>
              </>
            )}

            {isAdmin && cra.status === "submitted" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-comment">Commentaire administrateur</Label>
                    <Textarea
                      id="admin-comment"
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Ajouter un commentaire (optionnel)..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusChange("approved")}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange("rejected")}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </>
            )}

            {cra.admin_comment && (
              <div>
                <Label className="text-muted-foreground">Commentaire administrateur</Label>
                <p className="mt-1 p-3 rounded-lg bg-muted">{cra.admin_comment}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <div className="text-xs text-muted-foreground">
                Créé le {format(new Date(cra.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <CraFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          userId={cra.user_id}
          editingCra={cra}
          onSuccess={() => {
            setShowEditDialog(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
