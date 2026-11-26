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
    name: "Appointments",
    basePath: "/appointments",
    TSKey: "Appointments",
    icon: "appointments",
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
    name: "Refer & Earn",
    basePath: "/refer",
    TSKey: "Refer",
    icon: "refer",
  },
  {
    name: "Settings",
    basePath: "/profile",
    TSKey: "Profile",
    icon: "settings",
  },
];
