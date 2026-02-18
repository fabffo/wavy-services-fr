import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/api-client";
import { Mail, Phone, Download } from "lucide-react";

const ApplicationsManager = () => {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, jobs(title)")
      .order("created_at", { ascending: false });
    if (data) setApplications(data);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Candidatures Reçues</h2>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{app.name}</h3>
                  <Badge variant="outline" className="mt-2">
                    {app.jobs?.title || "Offre supprimée"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <a href={`mailto:${app.email}`} className="text-secondary hover:underline">
                    {app.email}
                  </a>
                </div>
                {app.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <a href={`tel:${app.phone}`} className="text-secondary hover:underline">
                      {app.phone}
                    </a>
                  </div>
                )}
                {app.cv_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { data } = await supabase.storage.from("cvs").download(app.cv_url);
                      if (data) {
                        const url = URL.createObjectURL(data);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `CV-${app.name}.pdf`;
                        a.click();
                      }
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Télécharger le CV
                  </Button>
                )}
              </div>

              {app.message && (
                <div className="mt-4 p-4 bg-muted rounded">
                  <p className="text-sm">{app.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune candidature reçue</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationsManager;