/**
 * iconMap - centralised semantic icon registry for the GCLBA portal.
 *
 * RULES
 * ─────────────────────────
 * • All icons come from lucide-react, outline style only.
 * • Import from this file instead of lucide-react directly.
 * • Use with <AppIcon icon={ICONS.dashboard} /> for consistency.
 */

import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  Settings,
  Mail,
  Upload,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  FileText,
  ExternalLink,
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Send,
  Camera,
  X,
  Clock,
  AlertCircle,
  Home,
  Timer,
  Menu,
  ListChecks,
  ListTodo,
  MapPin,
  ScrollText,
  Eye,
  Scale,
  Megaphone,
  Database,
  RefreshCw,
  ArrowUpDown,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  MailWarning,
  Loader2,
  BookOpen,
  Globe,
  Lock,
  ClipboardList,
  Lightbulb,
  Users,
  MousePointerClick,
  CircleDot,
  ArrowRightLeft,
  Inbox,
  UserCheck,
  FolderOpen,
} from 'lucide-react';

const ICONS = {
  // Nav
  dashboard:     LayoutDashboard,
  properties:    Building2,
  milestones:    CalendarClock,
  compliance:    ClipboardCheck,
  communication: MessageSquare,
  reports:       BarChart3,
  settings:      Settings,
  batchEmail:    Mail,
  buyerPortal:   ExternalLink,

  // Actions
  upload:        Upload,
  search:        Search,
  arrowRight:    ArrowRight,
  arrowLeft:     ArrowLeft,
  chevronLeft:   ChevronLeft,
  chevronRight:  ChevronRight,
  send:          Send,
  camera:        Camera,
  close:         X,
  menu:          Menu,

  // Status
  success:       CheckCircle2,
  warning:       AlertTriangle,
  danger:        AlertOctagon,
  info:          Info,
  clock:         Clock,
  alert:         AlertCircle,

  // Content
  file:          FileText,
  home:          Home,
  timer:         Timer,

  // SOP-Killer features
  actionQueue:   ListChecks,
  listTodo:      ListTodo,
  mapPin:        MapPin,
  auditTrail:    ScrollText,

  // Section headers & UI
  chevronDown:   ChevronDown,
  overview:      Eye,
  enforcement:   Scale,
  outreach:      Megaphone,

  // FileMaker Bridge / Integration
  database:      Database,
  sync:          RefreshCw,
  dataFlow:      ArrowUpDown,
  zap:           Zap,

  // Trends
  trendUp:       TrendingUp,
  trendDown:     TrendingDown,
  trendFlat:     Minus,

  // Buyer portal / confirmation
  shield:        Shield,
  shieldCheck:   ShieldCheck,
  copy:          Copy,

  // Education / How it Works
  bookOpen:      BookOpen,
  globe:         Globe,
  lock:          Lock,
  check:         Check,
  mailWarning:   MailWarning,
  loader:        Loader2,

  // SOP / How-To-Use
  clipboardList: ClipboardList,
  lightbulb:     Lightbulb,
  users:         Users,
  mouseClick:    MousePointerClick,
  circleDot:     CircleDot,
  arrowSwap:     ArrowRightLeft,
  inbox:         Inbox,
  userCheck:     UserCheck,
  folderOpen:    FolderOpen,
};

export default ICONS;
