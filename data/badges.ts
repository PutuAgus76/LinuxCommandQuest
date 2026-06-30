import { Badge } from "@/types";

export const badges: Badge[] = [
  {
    badgeId: "terminal-beginner",
    title: "Terminal Beginner",
    requirementDescription: "Selesaikan semua modul di Level 1 (mkdir, ls, cd, pwd)",
    iconName: "Terminal"
  },
  {
    badgeId: "file-explorer",
    title: "File Explorer",
    requirementDescription: "Selesaikan semua modul di Level 2 & 3 (touch, cat, echo, mv, cp, rm, rm -r)",
    iconName: "Folder"
  },
  {
    badgeId: "vim-survivor",
    title: "Vim Survivor",
    requirementDescription: "Selesaikan modul Level 4 (Vim)",
    iconName: "Code"
  },
  {
    badgeId: "permission-master",
    title: "Permission Master",
    requirementDescription: "Selesaikan modul Level 5 s/d 9 (materi permission, chmod, chown)",
    iconName: "Shield"
  },
  {
    badgeId: "cpanel-ready",
    title: "cPanel Ready",
    requirementDescription: "Selesaikan modul Level 10 (cPanel permission)",
    iconName: "CheckCircle"
  }
];
