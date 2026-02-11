/**
 * iconMap — centralised semantic icon registry for the GCLBA portal.
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
  MapPin,
  ScrollText,
  Eye,
  Scale,
  Megaphone,
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
  mapPin:        MapPin,
  auditTrail:    ScrollText,

  // Section headers & UI
  chevronDown:   ChevronDown,
  overview:      Eye,
  enforcement:   Scale,
  outreach:      Megaphone,
};

export default ICONS;
