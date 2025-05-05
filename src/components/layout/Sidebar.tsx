"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import clsx from "clsx"
import { sidebarMenu } from "@/lib/menu"

export function Sidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="w-64 h-screen bg-white border-r shadow-sm">
      <div className="p-6 text-xl font-bold">🏠 Homekeyy</div>
      <nav className="space-y-1">
        {sidebarMenu.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                onClick={() => toggleMenu(item.label)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-100 transition text-left"
              >
                <span className="flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5" />}
                  {item.label}
                </span>
                {openMenus[item.label] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {openMenus[item.label] && (
                <div className="ml-10 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={clsx(
                        "block px-2 py-2 rounded hover:bg-gray-100 text-sm",
                        pathname === child.href && "bg-gray-100 font-medium"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              className={clsx(
                "flex items-center gap-3 px-6 py-3 hover:bg-gray-100 transition",
                pathname === item.href && "bg-gray-100 font-medium"
              )}
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              {item.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  )
}