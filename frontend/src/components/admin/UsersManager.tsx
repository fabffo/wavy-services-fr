import { useState, useEffect } from "react";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, UserPlus, ShieldPlus, Mail, Pencil } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  roles: string[];
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "user_cra", label: "Consultant CRA" },
];

const UsersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<string>("user_cra");
  const [creating, setCreating] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignRole, setAssignRole] = useState<string>("user_cra");
  const [assigning, setAssigning] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await supabase.get('/api/users');
      setUsers(data.map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        created_at: u.created_at,
        roles: u.roles ?? [],
      })));
    } catch (error: any) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: { email, password, role, first_name: firstName, last_name: lastName },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la création');
      }

      toast.success("Utilisateur créé avec succès");
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("user_cra");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (userId: string, roleToDelete: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", roleToDelete as any);

      if (error) throw error;

      toast.success("Rôle supprimé");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression du rôle");
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAssigning(true);
    try {
      await supabase.post(`/api/users/${selectedUser.id}/roles`, { role: assignRole });
      toast.success("Rôle assigné avec succès");
      setAssignDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'assignation du rôle");
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setAssignRole("user_cra");
    setAssignDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setEditFirstName(user.first_name ?? "");
    setEditLastName(user.last_name ?? "");
    setEditEmail(user.email);
    setEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      await supabase.patch(`/api/users/${editUser.id}`, {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail !== editUser.email ? editEmail : undefined,
      });
      toast.success("Utilisateur mis à jour");
      setEditDialogOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleSendWelcomeEmail = async (user: User) => {
    try {
      await supabase.post('/api/auth/reset-password', { email: user.email });
      toast.success(`Email de définition de mot de passe envoyé à ${user.email}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2" size={18} />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="first-name">Prénom</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Nom</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Création..." : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôles</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.first_name || user.last_name
                  ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Aucun rôle</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    title="Modifier l'utilisateur"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWelcomeEmail(user)}
                    title="Envoyer un email de définition de mot de passe"
                  >
                    <Mail size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignDialog(user)}
                    title="Assigner un rôle"
                  >
                    <ShieldPlus size={16} />
                  </Button>
                  {user.roles.map((r) => (
                    <Button
                      key={r}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(user.id, r)}
                      title={`Supprimer le rôle ${r}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog modification utilisateur */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-first-name">Prénom</Label>
                  <Input
                    id="edit-first-name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last-name">Nom</Label>
                  <Input
                    id="edit-last-name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog assignation de rôle */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleAssignRole} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utilisateur : <strong>{selectedUser.email}</strong>
              </p>
              <div>
                <Label htmlFor="assign-role">Rôle</Label>
                <Select value={assignRole} onValueChange={setAssignRole}>
                  <SelectTrigger id="assign-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={assigning}>
                {assigning ? "Assignation..." : "Assigner"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManager;