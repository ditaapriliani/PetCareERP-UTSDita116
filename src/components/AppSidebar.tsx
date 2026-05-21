import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PawPrint,
  Users,
  Receipt,
  UserCog,
  Bone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const crm = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produk", url: "/products", icon: PawPrint },
  { title: "Customer", url: "/customers", icon: Users },
  { title: "Transaksi", url: "/transactions", icon: Receipt },
];
const hr = [{ title: "Staff", url: "/staff", icon: UserCog }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderItem = (item: { title: string; url: string; icon: any }) => {
    const active = pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          className={
            active
              ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
              : ""
          }
        >
          <Link to={item.url}>
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bone className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">PetCare</span>
              <span className="text-xs text-muted-foreground">ERP Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{crm.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>HR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{hr.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
