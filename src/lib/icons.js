// Explicit icon registry.
//
// We reference icons dynamically by name (category metadata, dashboard nav),
// but `import * as Icons from 'lucide-react'` defeats tree-shaking and pulls
// the entire icon set (~1MB+) into the bundle. Importing only what we use and
// exposing a lookup map keeps the build lean and fast.

import {
  Sparkles, Boxes, Plug, BarChart3, LineChart, Server, Globe, Bug, Building2,
  CreditCard, Cloud, Smartphone, GitBranch, GitMerge, FileCode, FlaskConical,
  PenTool, Film, Palette, Shapes, NotebookPen, ListChecks, LayoutTemplate,
  Folder, LayoutDashboard, GraduationCap, Trophy, Bookmark, History, User,
  Settings, MessageSquare, Circle, Compass, Users, FolderTree, Bell, Award,
} from 'lucide-react';

export const ICONS = {
  Sparkles, Boxes, Plug, BarChart3, LineChart, Server, Globe, Bug, Building2,
  CreditCard, Cloud, Smartphone, GitBranch, GitMerge, FileCode, FlaskConical,
  PenTool, Film, Palette, Shapes, NotebookPen, ListChecks, LayoutTemplate,
  Folder, LayoutDashboard, GraduationCap, Trophy, Bookmark, History, User,
  Settings, MessageSquare, Circle, Compass, Users, FolderTree, Bell, Award,
};

// Resolve an icon component by name with a safe fallback.
export function getIcon(name) {
  return ICONS[name] || Folder;
}
