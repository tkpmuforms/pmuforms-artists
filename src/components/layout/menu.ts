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
    name: "Services",
    basePath: "/services",
    TSKey: "Services",
    icon: "services",
  },
  {
    name: "Inventory",
    basePath: "/inventory",
    TSKey: "Inventory",
    icon: "inventory",
  },
  {
    name: "Integrations",
    basePath: "/integrations",
    TSKey: "Integrations",
    icon: "integrations",
  },
  {
    name: "Profile",
    basePath: "/profile",
    TSKey: "Profile",
    icon: "profile",
  },
];
