export interface MenuItem {
  name: string;
  basePath: string;
  TSKey: string;
  icon?: string;
}

export const Menu: MenuItem[] = [
  {
    name: "Dashboard",
    basePath: "/dashboard",
    TSKey: "Dashboard",
    icon: "dashboard",
  },
  {
    name: "Clients",
    basePath: "/clients",
    TSKey: "Clients",
    icon: "clients",
  },
  {
    name: "Forms",
    basePath: "/forms",
    TSKey: "Forms",
    icon: "forms",
  },
  {
    name: "Profile",
    basePath: "/profile",
    TSKey: "Profile",
    icon: "profile",
  },
];
