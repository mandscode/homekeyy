import { Home, Users, Settings } from "lucide-react"

export const sidebarMenu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Users",
    icon: Users,
    children: [
      { label: "All Users", href: "/dashboard/users" },
      { label: "Invite User", href: "/dashboard/users/invite" },
    ],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]
