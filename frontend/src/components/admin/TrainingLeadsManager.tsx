import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/api-client";
import { Mail, Phone, Building } from "lucide-react";

const TrainingLeadsManager = () => {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("training_leads")
      .select("*, trainings(title)")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Demandes de Formation</h2>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{lead.name}</h3>
                  {lead.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Building size={14} />
                      {lead.company}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    {lead.trainings?.title || "Formation non spécifiée"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-secondary hover:underline">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="text-secondary hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
              </div>

              {lead.message && (
                <div className="mt-4 p-4 bg-muted rounded">
                  <p className="text-sm">{lead.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {leads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune demande reçue</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingLeadsManager;