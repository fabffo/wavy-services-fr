import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Send, UserX, Clock, CheckCircle, XCircle, Settings } from "lucide-react";
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
import { UserAssignmentDialog } from "./UserAssignmentDialog";

const invitationStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  accepted: { label: "Acceptée", variant: "outline", icon: CheckCircle },
  expired: { label: "Expirée", variant: "destructive", icon: XCircle },
  revoked: { label: "Révoquée", variant: "destructive", icon: UserX },
};

export function CraUsersManager() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [revokeInvitation, setRevokeInvitation] = useState<any>(null);
  const [assignmentUser, setAssignmentUser] = useState<any>(null);

  // Fetch CRA users
  const { data: craUsers, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["cra-users"],
    queryFn: async () => {
      const users = await supabase.get('/api/users');
      return users.filter((u: any) => Array.isArray(u.roles) && u.roles.includes('user_cra'));
    },
  });

  // Get assignment counts per user
  const { data: assignmentCounts } = useQuery({
    queryKey: ["assignment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_client_assignments")
        .select("user_id");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(a => {
        counts[a.user_id] = (counts[a.user_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch invitations
  const { data: invitations, isLoading: loadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: ["cra-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      // Generate token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create invitation
      const { error } = await supabase
        .from("user_invitations")
        .insert({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
        });

      if (error) throw error;

      // Generate invitation link
      const inviteLink = `${window.location.origin}/cra/auth?token=${token}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);

      toast.success("Invitation créée ! Le lien a été copié dans le presse-papier.", {
        description: "Partagez ce lien avec l'utilisateur pour qu'il crée son compte.",
        duration: 5000,
      });

      setShowInviteDialog(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message);
    }

    setLoading(false);
  };

  const handleRevokeInvitation = async () => {
    if (!revokeInvitation) return;

    try {
      const { error } = await supabase
        .from("user_invitations")
        .update({ status: "revoked" })
        .eq("id", revokeInvitation.id);

      if (error) throw error;

      toast.success("Invitation révoquée");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message);
    }

    setRevokeInvitation(null);
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/cra/auth?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Lien copié dans le presse-papier");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Utilisateurs CRA</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, leurs assignations et invitations
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Active Users */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Utilisateurs actifs</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assignations</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : craUsers && craUsers.length > 0 ? (
                craUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "—"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {assignmentCounts?.[user.id] || 0} client(s)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "dd MMMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignmentUser(user)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Assignations
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur CRA actif
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invitations */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Invitations</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingInvitations ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : invitations && invitations.length > 0 ? (
                invitations.map((invitation) => {
                  const statusInfo = invitationStatusLabels[invitation.status] || invitationStatusLabels.pending;
                  const StatusIcon = statusInfo.icon;
                  const isExpired = new Date(invitation.expires_at) < new Date() && invitation.status === "pending";

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.first_name} {invitation.last_name}
                      </TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant={isExpired ? "destructive" : statusInfo.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {isExpired ? "Expirée" : statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.expires_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.status === "pending" && !isExpired && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyInviteLink(invitation.token)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Copier le lien
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeInvitation(invitation)}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune invitation
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Assignment Dialog */}
      <UserAssignmentDialog
        open={!!assignmentUser}
        onOpenChange={() => setAssignmentUser(null)}
        user={assignmentUser}
      />

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur CRA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Un lien d'invitation valide 7 jours sera généré. Vous pourrez le copier et l'envoyer à l'utilisateur.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeInvitation} onOpenChange={() => setRevokeInvitation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer l'invitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utilisateur ne pourra plus utiliser ce lien pour créer son compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeInvitation} className="bg-destructive text-destructive-foreground">
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
