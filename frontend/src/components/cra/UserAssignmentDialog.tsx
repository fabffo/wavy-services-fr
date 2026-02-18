import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Briefcase, Building } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; full_name: string | null; email: string } | null;
}

export function UserAssignmentDialog({ open, onOpenChange, user }: UserAssignmentDialogProps) {
  const [clientId, setClientId] = useState("");
  const [missionName, setMissionName] = useState("");
  const [validatorId, setValidatorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteAssignment, setDeleteAssignment] = useState<any>(null);

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

  const { data: validators } = useQuery({
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

  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ["user-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_client_assignments")
        .select(`
          *,
          clients:client_id(name),
          client_validators:default_validator_id(name, email)
        `)
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Reset form when client changes
  useEffect(() => {
    setValidatorId("");
  }, [clientId]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_client_assignments")
        .insert({
          user_id: user?.id,
          client_id: clientId,
          mission_name: missionName.trim() || null,
          default_validator_id: validatorId || null,
        });

      if (error) throw error;

      toast.success("Assignation ajoutée");
      setClientId("");
      setMissionName("");
      setValidatorId("");
      refetch();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Cet utilisateur est déjà assigné à ce client");
      } else {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async () => {
    if (!deleteAssignment) return;

    try {
      const { error } = await supabase
        .from("user_client_assignments")
        .delete()
        .eq("id", deleteAssignment.id);

      if (error) throw error;

      toast.success("Assignation supprimée");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
    setDeleteAssignment(null);
  };

  // Filter out already assigned clients
  const availableClients = clients?.filter(
    c => !assignments?.some(a => a.client_id === c.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Assignations - {user?.full_name || user?.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add form */}
            <form onSubmit={handleAddAssignment} className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nom de la mission</Label>
                  <Input
                    value={missionName}
                    onChange={(e) => setMissionName(e.target.value)}
                    placeholder="Ex: Projet X"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valideur par défaut</Label>
                  <Select 
                    value={validatorId} 
                    onValueChange={setValidatorId}
                    disabled={!clientId || !validators?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!clientId ? "Choisir un client d'abord" : "Aucun"} />
                    </SelectTrigger>
                    <SelectContent>
                      {validators?.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading || !clientId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter l'assignation
                </Button>
              </div>
            </form>

            {/* Assignments list */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Mission</TableHead>
                    <TableHead>Valideur par défaut</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : assignments && assignments.length > 0 ? (
                    assignments.map((assignment: any) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {assignment.clients?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.mission_name ? (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              {assignment.mission_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment.client_validators ? (
                            <span>
                              {assignment.client_validators.name}
                              <span className="text-muted-foreground ml-1">
                                ({assignment.client_validators.email})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteAssignment(assignment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Aucune assignation
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAssignment} onOpenChange={() => setDeleteAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'assignation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'association avec le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
