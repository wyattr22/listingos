import { FileText, Mail, Home, FileSearch, DollarSign, BarChart2, Share2, Clock, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const freeTools = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Offer Strength", url: "/dashboard/offer-strength", icon: FileSearch },
  { title: "Listing Price", url: "/dashboard/listing-price", icon: DollarSign },
  { title: "Listing Generator", url: "/dashboard/listing", icon: FileText },
  { title: "Follow-Up Email", url: "/dashboard/follow-up", icon: Mail },
];

const proTools = [
  { title: "CMA Presentation", url: "/dashboard/cma", icon: BarChart2 },
  { title: "Email Drip", url: "/dashboard/drip", icon: Mail },
  { title: "Social Content Pack", url: "/dashboard/social", icon: Share2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5 border-b border-sidebar-border">
          {!collapsed ? (
            <span className="text-lg font-bold text-primary tracking-tight">ListingOS</span>
          ) : (
            <span className="text-lg font-bold text-primary">L</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                    <Home className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {freeTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 py-1.5 flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pro Tools</span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {proTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard/history"
                    end
                    className="hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {!collapsed && <span>History</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
