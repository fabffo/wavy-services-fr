import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building,
  LogOut,
  ArrowLeft,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CraView } from "@/pages/CraDashboard";

interface CraSidebarProps {
  userRole: "admin" | "user_cra";
  currentView: CraView;
  onViewChange: (view: CraView) => void;
  onLogout: () => void;
  userEmail?: string;
}

export function CraSidebar({ 
  userRole, 
  currentView, 
  onViewChange, 
  onLogout,
  userEmail 
}: CraSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const adminItems = [
    { title: "Tableau de bord", value: "dashboard" as CraView, icon: LayoutDashboard },
    { title: "Tous les CRA", value: "all-cra" as CraView, icon: ClipboardList },
    { title: "Utilisateurs CRA", value: "users" as CraView, icon: Users },
    { title: "Clients", value: "clients" as CraView, icon: Building },
  ];

  const userItems = [
    { title: "Mes CRA", value: "my-cra" as CraView, icon: ClipboardList },
  ];

  const items = userRole === "admin" ? adminItems : userItems;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!collapsed && "Espace CRA"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    onClick={() => onViewChange(item.value)}
                    isActive={currentView === item.value}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && userEmail && (
          <p className="text-xs text-sidebar-foreground/70 px-2 mb-2 truncate">
            {userEmail}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mb-1"
        >
          <Home className="h-4 w-4 mr-2" />
          {!collapsed && "Site vitrine"}
        </Button>
        {userRole === "admin" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mb-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {!collapsed && "Retour Admin"}
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Déconnexion"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}