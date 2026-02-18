import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { ClientValidatorsDialog } from "./ClientValidatorsDialog";

export function CraClientsManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteClient, setDeleteClient] = useState<any>(null);
  const [validatorsClient, setValidatorsClient] = useState<any>(null);

  const { data: clients, isLoading, refetch } = useQuery({
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

  // Get validator counts per client
  const { data: validatorCounts } = useQuery({
    queryKey: ["validator-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_validators")
        .select("client_id");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(v => {
        counts[v.client_id] = (counts[v.client_id] || 0) + 1;
      });
      return counts;
    },
  });

  const handleOpenDialog = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.name);
    } else {
      setEditingClient(null);
      setClientName("");
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }

    setLoading(true);

    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({ name: clientName.trim() })
          .eq("id", editingClient.id);
        if (error) throw error;
        toast.success("Client modifié");
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ name: clientName.trim() });
        if (error) throw error;
        toast.success("Client créé");
      }

      setShowDialog(false);
      refetch();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Un client avec ce nom existe déjà");
      } else {
        toast.error(error.message);
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteClient) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deleteClient.id);

      if (error) {
        if (error.code === "23503") {
          toast.error("Impossible de supprimer : des CRA sont liés à ce client");
        } else {
          throw error;
        }
      } else {
        toast.success("Client supprimé");
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message);
    }

    setDeleteClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Clients</h2>
          <p className="text-muted-foreground">
            Gérez la liste des clients et leurs valideurs CRA
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Valideurs</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : clients && clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {validatorCounts?.[client.id] || 0} valideur(s)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(client.created_at), "dd MMMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setValidatorsClient(client)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Valideurs
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteClient(client)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun client
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du client *</Label>
              <Input
                id="name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : editingClient ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Validators Dialog */}
      <ClientValidatorsDialog
        open={!!validatorsClient}
        onOpenChange={() => setValidatorsClient(null)}
        client={validatorsClient}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteClient?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
