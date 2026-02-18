import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, getDaysInMonth, getDay, startOfMonth, eachDayOfInterval, endOfMonth, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { CraCalendar } from "./CraCalendar";

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

interface CraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
  editingCra?: any;
}

export function CraFormDialog({ open, onOpenChange, userId, onSuccess, editingCra }: CraFormDialogProps) {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [clientId, setClientId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [missionName, setMissionName] = useState("");
  const [workedDays, setWorkedDays] = useState(0);
  const [absentDays, setAbsentDays] = useState(0);
  const [monthlyComment, setMonthlyComment] = useState("");
  const [dayDetails, setDayDetails] = useState<Record<string, { state: "worked" | "absent"; comment: string }>>({});
  const [loading, setLoading] = useState(false);
  const [useCalendar, setUseCalendar] = useState(true);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch user assignments for pre-filling
  const { data: userAssignments } = useQuery({
    queryKey: ["user-assignments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_client_assignments")
        .select(`
          *,
          client_validators:default_validator_id(name, email)
        `)
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch validators for selected client
  const { data: clientValidators } = useQuery({
    queryKey: ["client-validators", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("client_validators")
        .select("*")
        .eq("client_id", clientId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (editingCra) {
      setMonth(editingCra.month);
      setClientId(editingCra.client_id);
      setClientEmail(editingCra.client_email || "");
      setMissionName(editingCra.mission_name || "");
      setWorkedDays(editingCra.worked_days);
      setAbsentDays(editingCra.absent_days);
      setMonthlyComment(editingCra.monthly_comment || "");
      loadDayDetails(editingCra.id);
    } else {
      initializeCalendar(month);
    }
  }, [editingCra, month]);

  // Auto-fill mission and validator email when client changes
  useEffect(() => {
    if (!editingCra && clientId && userAssignments) {
      const assignment = userAssignments.find((a: any) => a.client_id === clientId);
      if (assignment) {
        // Pre-fill mission name
        if (assignment.mission_name) {
          setMissionName(assignment.mission_name);
        }
        // Pre-fill validator email
        if (assignment.client_validators?.email) {
          setClientEmail(assignment.client_validators.email);
        }
      }
    }
  }, [clientId, userAssignments, editingCra]);

  const loadDayDetails = async (craId: string) => {
    const { data } = await supabase
      .from("cra_day_details")
      .select("*")
      .eq("cra_report_id", craId);
    
    if (data) {
      const details: Record<string, { state: "worked" | "absent"; comment: string }> = {};
      data.forEach(d => {
        details[d.date] = { state: d.state as "worked" | "absent", comment: d.comment || "" };
      });
      setDayDetails(details);
    }
  };

  const initializeCalendar = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    const days = eachDayOfInterval({
      start: startOfMonth(date),
      end: endOfMonth(date),
    });

    const details: Record<string, { state: "worked" | "absent"; comment: string }> = {};
    let worked = 0;

    days.forEach(day => {
      if (!isWeekend(day)) {
        const dateStr = format(day, "yyyy-MM-dd");
        details[dateStr] = { state: "worked", comment: "" };
        worked++;
      }
    });

    setDayDetails(details);
    setWorkedDays(worked);
    setAbsentDays(0);
  };

  const handleDayChange = (date: string, state: "worked" | "absent") => {
    setDayDetails(prev => ({
      ...prev,
      [date]: { ...prev[date], state, comment: prev[date]?.comment || "" },
    }));

    // Recalculate totals
    const newDetails = { ...dayDetails, [date]: { state, comment: dayDetails[date]?.comment || "" } };
    const worked = Object.values(newDetails).filter(d => d.state === "worked").length;
    const absent = Object.values(newDetails).filter(d => d.state === "absent").length;
    setWorkedDays(worked);
    setAbsentDays(absent);
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (loading) return;
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    setLoading(true);

    try {
      // Check for existing CRA
      let existingQuery = supabase
        .from("cra_reports")
        .select("id")
        .eq("user_id", userId)
        .eq("client_id", clientId)
        .eq("month", month);

      // Only exclude current record when editing (avoid invalid filter with empty UUID)
      if (editingCra?.id) {
        existingQuery = existingQuery.neq("id", editingCra.id);
      }

      const { data: existing, error: existingError } = await existingQuery.maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        toast.error("Un CRA existe déjà pour ce mois et ce client");
        setLoading(false);
        return;
      }

      const status = asDraft ? "draft" as const : "submitted" as const;
      const craData = {
        user_id: userId,
        client_id: clientId,
        client_email: clientEmail || null,
        mission_name: missionName || null,
        month,
        worked_days: workedDays,
        absent_days: absentDays,
        monthly_comment: monthlyComment,
        status,
      };

      let craId: string;

      if (editingCra) {
        const { error } = await supabase
          .from("cra_reports")
          .update(craData)
          .eq("id", editingCra.id);
        if (error) throw error;
        craId = editingCra.id;

        // Delete old day details
        await supabase
          .from("cra_day_details")
          .delete()
          .eq("cra_report_id", craId);
      } else {
        const { data, error } = await supabase
          .from("cra_reports")
          .insert(craData)
          .select()
          .single();
        if (error) throw error;
        craId = data.id;
      }

      // Insert day details
      if (useCalendar && Object.keys(dayDetails).length > 0) {
        const detailsToInsert = Object.entries(dayDetails).map(([date, detail]) => ({
          cra_report_id: craId,
          date,
          state: detail.state,
          comment: detail.comment || null,
        }));

        const { error: detailsError } = await supabase
          .from("cra_day_details")
          .insert(detailsToInsert);
        
        if (detailsError) throw detailsError;
      }

      toast.success(asDraft ? "Brouillon enregistré" : "CRA soumis avec succès");
      onSuccess();
    } catch (error: any) {
      // Friendly message for unique constraint violations
      if (error?.code === "23505") {
        toast.error("Un CRA existe déjà pour ce mois et ce client");
      } else {
        toast.error(error.message);
      }
    }

    setLoading(false);
  };

  const monthDate = new Date(month + "-01");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCra ? "Modifier le CRA" : "Nouveau Compte-Rendu d'Activité"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Société</Label>
              <Input value="Wavy Services" disabled />
            </div>

            <div className="space-y-2">
              <Label>Mois *</Label>
              <div className="flex gap-2">
                <Select
                  value={month.split("-")[1]}
                  onValueChange={(m) => {
                    const newMonth = `${month.split("-")[0]}-${m}`;
                    setMonth(newMonth);
                    if (!editingCra) initializeCalendar(newMonth);
                  }}
                  disabled={!!editingCra}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={month.split("-")[0]}
                  onValueChange={(y) => {
                    const newMonth = `${y}-${month.split("-")[1]}`;
                    setMonth(newMonth);
                    if (!editingCra) initializeCalendar(newMonth);
                  }}
                  disabled={!!editingCra}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients
                    ?.filter(client => userAssignments?.some((a: any) => a.client_id === client.id))
                    .map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="missionName">Mission</Label>
              <Input
                id="missionName"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                placeholder="Nom de la mission"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email du valideur</Label>
              <div className="flex gap-2">
                {clientValidators && clientValidators.length > 0 ? (
                  <Select 
                    value={clientEmail} 
                    onValueChange={setClientEmail}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner un valideur" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientValidators.map(v => (
                        <SelectItem key={v.id} value={v.email}>
                          {v.name} ({v.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="valideur@entreprise.com"
                    className="flex-1"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Email du contact client pour la validation du CRA.
              </p>
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Détail par jour - {format(monthDate, "MMMM yyyy", { locale: fr })}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseCalendar(!useCalendar)}
              >
                {useCalendar ? "Masquer le calendrier" : "Afficher le calendrier"}
              </Button>
            </div>
            
            {useCalendar && (
              <CraCalendar
                month={month}
                dayDetails={dayDetails}
                onDayChange={handleDayChange}
              />
            )}
          </div>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="worked">Jours travaillés</Label>
              <Input
                id="worked"
                type="number"
                min={0}
                value={workedDays}
                onChange={(e) => setWorkedDays(parseInt(e.target.value) || 0)}
                disabled={useCalendar}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absent">Jours d'absence</Label>
              <Input
                id="absent"
                type="number"
                min={0}
                value={absentDays}
                onChange={(e) => setAbsentDays(parseInt(e.target.value) || 0)}
                disabled={useCalendar}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commentaires du mois</Label>
            <Textarea
              id="comment"
              value={monthlyComment}
              onChange={(e) => setMonthlyComment(e.target.value)}
              placeholder="Commentaires, remarques, informations complémentaires..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={loading}>
              Enregistrer brouillon
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={loading}>
              {loading ? "Envoi..." : "Soumettre"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}