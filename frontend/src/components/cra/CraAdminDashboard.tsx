import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText, Users, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CraDetailDialog } from "./CraDetailDialog";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  submitted: { label: "Soumis", variant: "default" },
  approved: { label: "Approuvé", variant: "outline" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export function CraAdminDashboard() {
  const [selectedCra, setSelectedCra] = useState<any>(null);
  const [filters, setFilters] = useState({
    month: "",
    client: "",
    status: "",
    search: "",
  });

  const { data: craReports, isLoading, refetch } = useQuery({
    queryKey: ["admin-cra-reports"],
    queryFn: async () => {
      const data = await supabase.get('/api/cra');
      return data || [];
    },
  });

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

  const stats = {
    total: craReports?.length || 0,
    submitted: craReports?.filter(c => c.status === "submitted").length || 0,
    approved: craReports?.filter(c => c.status === "approved").length || 0,
    pending: craReports?.filter(c => c.status === "draft").length || 0,
  };

  const exportToCSV = () => {
    if (!craReports) return;
    
    const headers = ["Mois", "Utilisateur", "Email", "Client", "Jours travaillés", "Jours absents", "Statut"];
    const rows = craReports.map(cra => [
      cra.month,
      cra.consultant_name || "",
      cra.consultant_email || "",
      cra.client_name || "",
      cra.worked_days,
      cra.absent_days,
      statusLabels[cra.status]?.label || cra.status,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cra-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredReports = craReports?.filter(cra => {
    if (filters.month && cra.month !== filters.month) return false;
    if (filters.client && cra.client_id !== filters.client) return false;
    if (filters.status && cra.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesName = cra.consultant_name?.toLowerCase().includes(search);
      const matchesEmail = cra.consultant_email?.toLowerCase().includes(search);
      const matchesClient = cra.client_name?.toLowerCase().includes(search);
      if (!matchesName && !matchesEmail && !matchesClient) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des CRA</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de tous les comptes-rendus d'activité
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CRA</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters(f => ({ ...f, month: e.target.value }))}
              placeholder="Mois"
            />
            <Select
              value={filters.client || "all"}
              onValueChange={(v) => setFilters(f => ({ ...f, client: v === "all" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="submitted">Soumis</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Jours travaillés</TableHead>
                <TableHead>Jours absents</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredReports && filteredReports.length > 0 ? (
                filteredReports.map((cra) => {
                  const status = statusLabels[cra.status] || statusLabels.draft;
                  const monthDate = new Date(cra.month + "-01");
                  
                  return (
                    <TableRow 
                      key={cra.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCra(cra)}
                    >
                      <TableCell className="font-medium">
                        {format(monthDate, "MMMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{cra.consultant_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{cra.consultant_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{cra.client_name || "—"}</TableCell>
                      <TableCell>{cra.worked_days}</TableCell>
                      <TableCell>{cra.absent_days}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun CRA trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCra && (
        <CraDetailDialog
          open={!!selectedCra}
          onOpenChange={(open) => !open && setSelectedCra(null)}
          cra={selectedCra}
          isAdmin={true}
          onUpdate={() => {
            refetch();
            setSelectedCra(null);
          }}
        />
      )}
    </div>
  );
}