import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutGrid,
  Briefcase,
  GraduationCap,
  FileText,
  TerminalSquare,
  Wrench,
  Boxes,
  Star,
  Gift,
  Wallet,
  Bell,
  Bookmark,
  FolderOpen,
  Building2,
  User,
  HelpCircle,
  Info,
  Mail,
  Newspaper,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Drawer icon-tile tint (matches mobile DrawerContent colours). */
  tint: string;
  bg: string;
  /** Only shown to signed-in users. */
  authOnly?: boolean;
}

/** Primary modules shown in the desktop header. */
export const HEADER_LINKS: NavItem[] = [
  { label: "Projects", href: "/projects", icon: LayoutGrid, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "Jobs", href: "/jobs", icon: Briefcase, tint: "#3B82F6", bg: "#DBEAFE" },
  { label: "Learning", href: "/learning", icon: GraduationCap, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Blog", href: "/blog", icon: Newspaper, tint: "#7C3AED", bg: "#EDE9FE" },
  { label: "Resume", href: "/resume", icon: FileText, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Compiler", href: "/compiler", icon: TerminalSquare, tint: "#0D9488", bg: "#CCFBF1" },
];

/** Full destination list for the mobile drawer — mirrors the app's DrawerContent. */
export const DRAWER_LINKS: NavItem[] = [
  { label: "Home", href: "/", icon: Home, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "Projects", href: "/projects", icon: LayoutGrid, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "My Projects", href: "/account/purchases", icon: FolderOpen, tint: "#F59E0B", bg: "#FEF3C7", authOnly: true },
  { label: "Custom Project Builder", href: "/custom-projects", icon: Wrench, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "My Custom Projects", href: "/custom-projects/my-projects", icon: Boxes, tint: "#0D9488", bg: "#CCFBF1", authOnly: true },
  { label: "Jobs", href: "/jobs", icon: Briefcase, tint: "#3B82F6", bg: "#DBEAFE" },
  { label: "Learning", href: "/learning", icon: GraduationCap, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Blog", href: "/blog", icon: Newspaper, tint: "#7C3AED", bg: "#EDE9FE" },
  { label: "Resume Builder", href: "/resume", icon: FileText, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Compiler", href: "/compiler", icon: TerminalSquare, tint: "#0D9488", bg: "#CCFBF1" },
  { label: "Companies", href: "/jobs/companies", icon: Building2, tint: "#0D9488", bg: "#CCFBF1" },
  { label: "Referral & Earn", href: "/referral", icon: Gift, tint: "#EC4899", bg: "#FCE7F3" },
  { label: "Premium", href: "/premium", icon: Star, tint: "#F59E0B", bg: "#FEF3C7" },
  { label: "Saved Jobs", href: "/account/saved-jobs", icon: Bookmark, tint: "#EC4899", bg: "#FCE7F3", authOnly: true },
  { label: "Wallet", href: "/account/wallet", icon: Wallet, tint: "#7C3AED", bg: "#EDE9FE", authOnly: true },
  { label: "Notifications", href: "/account/notifications", icon: Bell, tint: "#7C3AED", bg: "#EDE9FE", authOnly: true },
  { label: "My Account", href: "/account", icon: User, tint: "#4F39F6", bg: "#EEF0FF", authOnly: true },
  { label: "Help & FAQ", href: "/faq", icon: HelpCircle, tint: "#2563EB", bg: "#DBEAFE" },
  { label: "Contact", href: "/contact", icon: Mail, tint: "#2563EB", bg: "#DBEAFE" },
  { label: "About", href: "/about", icon: Info, tint: "#2563EB", bg: "#DBEAFE" },
];

/** Bottom navigation on mobile — mirrors the app's 5-tab bar. */
export const BOTTOM_TABS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Projects", href: "/projects", icon: LayoutGrid },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Learning", href: "/learning", icon: GraduationCap },
  { label: "Account", href: "/account", icon: User },
];
