// handoff/src/components/AppSidebar.tsx
// Reskinned sidebar — warm paper, thin rules, serif wordmark.

import { FileText, Mail, Home, FileSearch, DollarSign, BarChart2, Share2, Clock, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-background">
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          <div className="w-[22px] h-[22px] bg-foreground rounded-[2px] flex items-center justify-center shrink-0">
            <div className="w-2 h-2 border border-background rounded-full" />
          </div>
          {!collapsed && (
            <span className="font-serif text-[15px] tracking-tight text-foreground">Listingos</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {freeTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-secondary rounded-[2px] text-muted-foreground"
                      activeClassName="bg-secondary text-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-[13px] w-[13px]" />
                      {!collapsed && <span className="text-[12.5px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 pt-3 pb-2 flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-accent" />
              <span className="los-mlabel" style={{ color: "hsl(var(--accent))" }}>Pro Tools</span>
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
                      className="hover:bg-secondary rounded-[2px] text-muted-foreground"
                      activeClassName="bg-secondary text-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-[13px] w-[13px]" />
                      {!collapsed && <span className="text-[12.5px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard/history"
                    end
                    className="hover:bg-secondary rounded-[2px] text-muted-foreground"
                    activeClassName="bg-secondary text-foreground font-medium"
                  >
                    <Clock className="mr-2 h-[13px] w-[13px]" />
                    {!collapsed && <span className="text-[12.5px]">History</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer stats */}
        {!collapsed && (
          <div className="mt-auto px-5 pt-4 pb-5 border-t border-border">
            <div className="los-mlabel mb-2.5">This week</div>
            <FooterStat k="Showings" v="12" />
            <FooterStat k="New leads" v="4" />
            <FooterStat k="CMAs run" v="9" />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function FooterStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[11.5px] py-[3px] text-muted-foreground">
      <span>{k}</span>
      <span className="los-num text-foreground">{v}</span>
    </div>
  );
}
