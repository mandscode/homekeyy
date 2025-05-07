import {
  Tag,
  Users,
  Settings,
  // Bookmark,
  LayoutGrid,
  LucideIcon,
  Building
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  console.log(pathname)
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Contents",
      menus: [
        // {
        //   href: "",
        //   label: "Properties",
        //   icon: Building,
        //   submenus: [
        //     {
        //       href: "/properties",
        //       label: "All Properties"
        //     },
        //     {
        //       href: "/properties/new",
        //       label: "New Property"
        //     }
        //   ]
        // },
        {
          href: "/properties",
          label: "Properties",
          icon: Building
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
