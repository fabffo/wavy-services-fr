import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CraFormDialog } from "./CraFormDialog";
import { CraDetailDialog } from "./CraDetailDialog";

interface CraUserDashboardProps {
  userId: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const clientValidationLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Non envoyé", color: "text-muted-foreground" },
  sent: { label: "En attente", color: "text-yellow-600" },
  approved: { label: "Validé", color: "text-green-600" },
  rejected: { label: "Rejeté", color: "text-red-600" },
};

export function CraUserDashboard({ userId }: CraUserDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCra, setSelectedCra] = useState<any>(null);

  const { data: userAssignments } = useQuery({
    queryKey: ["user-assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_client_assignments")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const hasAssignments = userAssignments && userAssignments.length > 0;

  const { data: craReports, isLoading, refetch } = useQuery({
    queryKey: ["user-cra-reports", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cra_reports")
        .select(`
          *,
          clients (name)
        `)
        .eq("user_id", userId)
        .order("month", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const currentMonth = format(new Date(), "yyyy-MM");
  const hasCurrentMonthCra = craReports?.some(cra => cra.month === currentMonth);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mes Comptes-Rendus d'Activité</h2>
          <p className="text-muted-foreground">
            Gérez vos CRA mensuels
          </p>
        </div>
        {hasAssignments ? (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau CRA
          </Button>
        ) : null}
      </div>

      {!hasAssignments && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Calendar className="h-5 w-5 text-destructive" />
            <span className="text-sm">
              Aucun client/projet ne vous a été affecté. Contactez votre administrateur pour pouvoir saisir un CRA.
            </span>
          </CardContent>
        </Card>
      )}

      {hasAssignments && !hasCurrentMonthCra && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm">
                Vous n'avez pas encore créé votre CRA pour {format(new Date(), "MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              Créer maintenant
            </Button>
          </CardContent>
        </Card>
      )}

      {craReports && craReports.length > 0 ? (
        <div className="grid gap-4">
          {craReports.map((cra) => {
            const status = statusLabels[cra.status] || statusLabels.draft;
            const monthDate = new Date(cra.month + "-01");
            
            return (
              <Card 
                key={cra.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedCra(cra)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(monthDate, "MMMM yyyy", { locale: fr })}
                    </CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardDescription>
                    Client: {cra.clients?.name || "Non spécifié"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{cra.worked_days} jours travaillés</span>
                    </div>
                    <div>
                      <span>{cra.absent_days} jours d'absence</span>
                    </div>
                    {cra.client_validation_status && cra.client_validation_status !== "pending" && (
                      <div className={`flex items-center gap-1 ${clientValidationLabels[cra.client_validation_status]?.color || ""}`}>
                        <Mail className="h-4 w-4" />
                        <span>{clientValidationLabels[cra.client_validation_status]?.label}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucun CRA</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé de compte-rendu d'activité
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier CRA
            </Button>
          </CardContent>
        </Card>
      )}

      <CraFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {selectedCra && (
        <CraDetailDialog
          open={!!selectedCra}
          onOpenChange={(open) => !open && setSelectedCra(null)}
          cra={selectedCra}
          isAdmin={false}
          onUpdate={() => {
            refetch();
            setSelectedCra(null);
          }}
        />
      )}
    </div>
  );
}

function ClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}