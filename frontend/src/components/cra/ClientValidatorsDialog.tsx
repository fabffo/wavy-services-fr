import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Mail, User } from "lucide-react";
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

interface ClientValidatorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { id: string; name: string } | null;
}

export function ClientValidatorsDialog({ open, onOpenChange, client }: ClientValidatorsDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteValidator, setDeleteValidator] = useState<any>(null);

  const { data: validators, isLoading, refetch } = useQuery({
    queryKey: ["client-validators", client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data, error } = await supabase
        .from("client_validators")
        .select("*")
        .eq("client_id", client.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!client?.id,
  });

  const handleAddValidator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) {
      toast.error("Veuillez saisir au moins un prénom ou un nom");
      return;
    }
    if (!email.trim()) {
      toast.error("Veuillez saisir un email");
      return;
    }

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    setLoading(true);
    try {
      const { error } = await supabase
        .from("client_validators")
        .insert({
          client_id: client?.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          name: fullName,
          email: email.trim().toLowerCase(),
        });

      if (error) throw error;

      toast.success("Valideur ajouté");
      setFirstName("");
      setLastName("");
      setEmail("");
      refetch();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Ce valideur existe déjà pour ce client");
      } else {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  const handleDeleteValidator = async () => {
    if (!deleteValidator) return;

    try {
      const { error } = await supabase
        .from("client_validators")
        .delete()
        .eq("id", deleteValidator.id);

      if (error) throw error;

      toast.success("Valideur supprimé");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
    setDeleteValidator(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Valideurs CRA - {client?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add form */}
            <form onSubmit={handleAddValidator} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="validatorFirstName">Prénom</Label>
                <Input
                  id="validatorFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="validatorLastName">Nom</Label>
                <Input
                  id="validatorLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="validatorEmail">Email</Label>
                <Input
                  id="validatorEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@client.com"
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </form>

            {/* Validators list */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
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
                  ) : validators && validators.length > 0 ? (
                    validators.map((validator) => (
                      <TableRow key={validator.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {validator.first_name || <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {validator.last_name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {validator.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteValidator(validator)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Aucun valideur configuré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteValidator} onOpenChange={() => setDeleteValidator(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le valideur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteValidator?.name}" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteValidator} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
