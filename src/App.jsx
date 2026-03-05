import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Package, QrCode, BarChart3, FileText, LogOut, Scan, Plus, Search, Printer, TrendingUp, TrendingDown, Users, CheckCircle, AlertTriangle, Clock, ChevronRight, X, Check, Camera, Download, Eye, Shield, Activity, Box, Layers, Menu } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { supabase } from "./lib/supabase";
import {
  QRCodeReader,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
} from "@zxing/library";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_ITEMS = [
  { id: "1", name: "Box of Screws (M6)", sku: "DAL-001", category: "Fixings", unit: "box", lastCount: 24, lastLogged: "2026-03-04", threshold: 5 },
  { id: "2", name: "Silicone Tape (Black)", sku: "DAL-002", category: "Sealing", unit: "roll", lastCount: 8, lastLogged: "2026-03-04", threshold: 3 },
  { id: "3", name: "Safety Helmets", sku: "DAL-003", category: "PPE", unit: "piece", lastCount: 12, lastLogged: "2026-03-03", threshold: 10 },
  { id: "4", name: "Hi-Vis Vests (Large)", sku: "DAL-004", category: "PPE", unit: "piece", lastCount: 7, lastLogged: "2026-03-04", threshold: 5 },
  { id: "5", name: "Masking Tape (50mm)", sku: "DAL-005", category: "Sealing", unit: "roll", lastCount: 3, lastLogged: "2026-03-02", threshold: 5 },
  { id: "6", name: "Rawl Bolts (M10)", sku: "DAL-006", category: "Fixings", unit: "box", lastCount: 18, lastLogged: "2026-03-04", threshold: 5 },
  { id: "7", name: "Safety Gloves (M)", sku: "DAL-007", category: "PPE", unit: "pair", lastCount: 2, lastLogged: "2026-03-01", threshold: 6 },
  { id: "8", name: "PVC Conduit (20mm)", sku: "DAL-008", category: "Electrical", unit: "length", lastCount: 45, lastLogged: "2026-03-04", threshold: 10 },
  { id: "9", name: "Cable Ties (300mm)", sku: "DAL-009", category: "Electrical", unit: "bag", lastCount: 11, lastLogged: "2026-03-03", threshold: 3 },
  { id: "10", name: "Expanding Foam", sku: "DAL-010", category: "Sealing", unit: "can", lastCount: 6, lastLogged: "2026-03-04", threshold: 3 },
  { id: "11", name: "Self-Drill Screws", sku: "DAL-011", category: "Fixings", unit: "box", lastCount: 31, lastLogged: "2026-03-04", threshold: 8 },
  { id: "12", name: "Hard Hat Stickers", sku: "DAL-012", category: "PPE", unit: "sheet", lastCount: 15, lastLogged: "2026-03-02", threshold: 5 },
  { id: "13", name: "Dust Masks (FFP2)", sku: "DAL-013", category: "PPE", unit: "box", lastCount: 4, lastLogged: "2026-03-04", threshold: 5 },
  { id: "14", name: "Drill Bits (HSS Set)", sku: "DAL-014", category: "Tools", unit: "set", lastCount: 3, lastLogged: "2026-03-01", threshold: 2 },
  { id: "15", name: "Spirit Level (1.2m)", sku: "DAL-015", category: "Tools", unit: "piece", lastCount: 4, lastLogged: "2026-03-03", threshold: 2 },
];

const MOCK_USERS = [
  { id: "u1", name: "Seán Murphy", email: "sean@inventoryflow.ie", role: "admin", scansToday: 12, scansWeek: 67, scansMonth: 198 },
  { id: "u2", name: "Aoife Kelly", email: "aoife@inventoryflow.ie", role: "user", scansToday: 8, scansWeek: 45, scansMonth: 134 },
  { id: "u3", name: "Ciarán Walsh", email: "ciaran@inventoryflow.ie", role: "user", scansToday: 5, scansWeek: 32, scansMonth: 89 },
];

const MOCK_LOGS = [
  { id: "l1", item: "Box of Screws (M6)", sku: "DAL-001", user: "Seán Murphy", count: 24, time: "09:14", date: "2026-03-04" },
  { id: "l2", item: "Silicone Tape (Black)", sku: "DAL-002", user: "Aoife Kelly", count: 8, time: "09:22", date: "2026-03-04" },
  { id: "l3", item: "Safety Helmets", sku: "DAL-003", user: "Seán Murphy", count: 12, time: "09:31", date: "2026-03-04" },
  { id: "l4", item: "Hi-Vis Vests", sku: "DAL-004", user: "Ciarán Walsh", count: 7, time: "10:05", date: "2026-03-04" },
  { id: "l5", item: "PVC Conduit", sku: "DAL-008", user: "Aoife Kelly", count: 45, time: "10:18", date: "2026-03-04" },
  { id: "l6", item: "Expanding Foam", sku: "DAL-010", user: "Seán Murphy", count: 6, time: "10:45", date: "2026-03-04" },
];

const TREND_DATA = [
  { day: "Mon", screws: 28, tape: 10, helmets: 12 },
  { day: "Tue", screws: 25, tape: 9, helmets: 12 },
  { day: "Wed", screws: 27, tape: 8, helmets: 11 },
  { day: "Thu", screws: 22, tape: 8, helmets: 12 },
  { day: "Fri", screws: 24, tape: 8, helmets: 12 },
  { day: "Sat", screws: 24, tape: 7, helmets: 12 },
  { day: "Today", screws: 24, tape: 8, helmets: 12 },
];

const SCAN_ACTIVITY = [
  { week: "W1 Feb", scans: 45 }, { week: "W2 Feb", scans: 62 },
  { week: "W3 Feb", scans: 58 }, { week: "W4 Feb", scans: 71 },
  { week: "W1 Mar", scans: 55 }, { week: "W2 Mar", scans: 78 },
];

const CATEGORY_DATA = [
  { name: "PPE", value: 6, color: "#00A1E5" },
  { name: "Fixings", value: 4, color: "#1e3a5f" },
  { name: "Sealing", value: 3, color: "#0ea5e9" },
  { name: "Electrical", value: 2, color: "#22c55e" },
  { name: "Tools", value: 2, color: "#a855f7" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #181B2C;
    --navy-mid: #003388;
    --navy-light: #2a4f7f;
    --accent: #00A1E5;
    --accent-dark: #0088c4;
    --accent-light: #5bbad5;
    --steel: #64748b;
    --steel-light: #94a3b8;
    --bg: #F0F0F0;
    --bg-card: #ffffff;
    --border: #e2e8f0;
    --text: #181B2C;
    --text-muted: #64748b;
    --green: #16a34a;
    --red: #dc2626;
    --yellow: #ca8a04;
  }

  body { font-family: 'Barlow', sans-serif; background: var(--bg); color: var(--text); }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: 240px; background: var(--navy); display: flex; flex-direction: column;
    flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.05);
  }
  .sidebar-logo {
    padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .logo-mark {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
    font-size: 22px; color: #fff; letter-spacing: 0.5px; line-height: 1;
  }
  .logo-sub { font-size: 10px; color: var(--accent); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .nav-section { padding: 16px 16px 6px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 20px;
    color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; border-left: 3px solid transparent;
    user-select: none;
  }
  .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav-item.active { color: #fff; background: rgba(0,161,229,0.15); border-left-color: var(--accent); }
  .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }
  .sidebar-user {
    padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; gap: 10px;
    min-width: 0;
  }
  .sidebar-user > div:not(.user-avatar) { flex: 1; min-width: 0; overflow: hidden; }
  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%; background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0;
  }
  .user-name { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .user-role { font-size: 11px; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .logout-btn {
    flex-shrink: 0; margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.3);
    cursor: pointer; padding: 6px; border-radius: 4px; display: flex; transition: color 0.15s;
  }
  .logout-btn:hover { color: var(--accent); }

  /* MAIN */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar {
    background: #fff; border-bottom: 1px solid var(--border);
    padding: 0 28px; height: 60px; display: flex; align-items: center; gap: 16px;
    flex-shrink: 0;
  }
  .topbar-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 20px; color: var(--navy); }
  .topbar-breadcrumb { font-size: 13px; color: var(--steel-light); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .badge { background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
  .date-chip { font-size: 12px; color: var(--steel); background: var(--bg); padding: 4px 10px; border-radius: 6px; font-weight: 500; }

  .content { flex: 1; overflow-y: auto; padding: 28px; }

  /* CARDS */
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .card-sm { padding: 16px; }

  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: #fff; border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; display: flex; flex-direction: column; gap: 8px; position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--accent, var(--navy-mid));
  }
  .stat-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--steel); }
  .stat-value { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 800; color: var(--navy); line-height: 1; }
  .stat-sub { font-size: 12px; color: var(--steel); display: flex; align-items: center; gap: 4px; }
  .stat-icon { position: absolute; right: 16px; top: 16px; opacity: 0.08; }
  .stat-icon svg { width: 40px; height: 40px; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
    border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'Barlow', sans-serif;
    cursor: pointer; border: none; transition: all 0.15s; text-decoration: none;
  }
  .btn svg { width: 15px; height: 15px; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent-dark); }
  .btn-secondary { background: var(--navy); color: #fff; }
  .btn-secondary:hover { background: var(--navy-mid); }
  .btn-ghost { background: transparent; color: var(--steel); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--bg); color: var(--navy); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { padding: 8px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--steel); cursor: pointer; display: inline-flex; transition: all 0.15s; }
  .btn-icon:hover { background: var(--navy); color: #fff; border-color: var(--navy); }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--steel); border-bottom: 2px solid var(--border); }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg); }

  /* TAGS */
  .tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .tag-blue { background: #dbeafe; color: #1e40af; }
  .tag-green { background: #dcfce7; color: #15803d; }
  .tag-orange { background: #ffedd5; color: #c2410c; }
  .tag-emerald { background: #d1fae5; color: #047857; }
  .tag-blue-accent { background: #e0f7ff; color: #0066a1; }
  .tag-red { background: #fee2e2; color: #b91c1c; }
  .tag-purple { background: #f3e8ff; color: #7e22ce; }
  .tag-gray { background: #f1f5f9; color: #475569; }

  /* STOCK STATUS */
  .stock-ok { color: var(--green); font-weight: 600; }
  .stock-low { color: var(--yellow); font-weight: 600; }
  .stock-critical { color: var(--red); font-weight: 600; }

  /* LOGIN */
  .login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--navy);
    background-image: repeating-linear-gradient(
      45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px,
      transparent 1px, transparent 60px
    );
  }
  .login-card {
    background: #fff; border-radius: 16px; padding: 48px 40px; width: 400px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.4);
  }
  .login-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 28px; color: var(--navy); }
  .login-logo span { color: var(--accent); }
  .login-sub { font-size: 13px; color: var(--steel); margin-top: 4px; margin-bottom: 32px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 6px; letter-spacing: 0.5px; }
  .form-input {
    width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 8px;
    font-size: 14px; font-family: 'Barlow', sans-serif; color: var(--text); transition: border 0.15s;
    background: var(--bg);
  }
  .form-input:focus { outline: none; border-color: var(--accent); background: #fff; }
  .login-footer { font-size: 12px; color: var(--steel); text-align: center; margin-top: 20px; }

  /* SCAN PAGE */
  .scan-container { max-width: 480px; margin: 0 auto; }
  .scan-viewfinder {
    background: var(--navy); border-radius: 16px; aspect-ratio: 1;
    min-height: 280px; width: 100%;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; margin-bottom: 20px;
  }
  .scan-corner {
    position: absolute; width: 40px; height: 40px; border-color: var(--accent);
    border-style: solid; border-width: 0;
  }
  .scan-corner.tl { top: 20px; left: 20px; border-top-width: 3px; border-left-width: 3px; }
  .scan-corner.tr { top: 20px; right: 20px; border-top-width: 3px; border-right-width: 3px; }
  .scan-corner.bl { bottom: 20px; left: 20px; border-bottom-width: 3px; border-left-width: 3px; }
  .scan-corner.br { bottom: 20px; right: 20px; border-bottom-width: 3px; border-right-width: 3px; }
  .scan-line {
    position: absolute; left: 20px; right: 20px; height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    animation: scanAnim 2s ease-in-out infinite;
  }
  @keyframes scanAnim { 0%, 100% { top: 20px; } 50% { top: calc(100% - 22px); } }
  .scan-icon-center { color: rgba(255,255,255,0.15); }

  .scan-result-card {
    background: var(--navy); color: #fff; border-radius: 16px; padding: 24px; margin-bottom: 20px;
    border: 2px solid var(--accent);
  }
  .scan-item-name { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; }
  .scan-item-sku { font-size: 12px; color: var(--accent-light); margin-top: 2px; }
  .count-input-wrap { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
  .count-btn {
    width: 48px; height: 48px; border-radius: 10px; border: none; cursor: pointer;
    font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center;
    background: var(--accent); color: #fff; transition: background 0.15s;
  }
  .count-btn:hover { background: var(--accent-dark); }
  .count-display {
    flex: 1; text-align: center; font-family: 'Barlow Condensed', sans-serif;
    font-size: 48px; font-weight: 800; color: var(--navy); background: var(--bg);
    border: 2px solid var(--border); border-radius: 10px; padding: 8px;
  }

  /* QR Display */
  .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .qr-card {
    background: #fff; border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; text-align: center; cursor: pointer; transition: all 0.15s;
  }
  .qr-card:hover { border-color: var(--accent); box-shadow: 0 4px 20px rgba(0,161,229,0.15); transform: translateY(-2px); }
  .qr-code-area {
    width: 100px; height: 100px; background: var(--navy); border-radius: 8px;
    margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .qr-pattern { position: absolute; inset: 0; }
  .qr-item-name { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 2px; }
  .qr-sku { font-size: 10px; color: var(--steel); }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: #fff; border-radius: 16px; padding: 28px; width: 480px; max-width: 100%;
    max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.3);
  }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; color: var(--navy); }
  .modal-close { background: var(--bg); border: none; border-radius: 8px; padding: 8px; cursor: pointer; color: var(--steel); display: flex; }
  .modal-close:hover { background: var(--border); }

  /* QR PRINT */
  .qr-print-area {
    background: #fff; border: 3px solid var(--navy); border-radius: 12px;
    padding: 24px; text-align: center; max-width: 220px; margin: 0 auto;
  }
  .qr-visual {
    width: 160px; height: 160px; background: var(--navy); border-radius: 8px;
    margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }

  /* KPI */
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi-user-card {
    background: #fff; border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; display: flex; align-items: center; gap: 14px;
  }
  .kpi-avatar {
    width: 48px; height: 48px; border-radius: 50%; background: var(--navy);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px; color: #fff; flex-shrink: 0;
  }
  .kpi-name { font-weight: 700; font-size: 14px; color: var(--navy); }
  .kpi-meta { font-size: 12px; color: var(--steel); }
  .kpi-scans { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent); }

  .progress-bar { background: var(--border); border-radius: 4px; height: 8px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--navy-mid), var(--accent)); transition: width 0.5s; }

  /* ALERTS */
  .alert { border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; margin-bottom: 12px; }
  .alert-red { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .alert-yellow { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
  .alert-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .alert svg { width: 16px; height: 16px; flex-shrink: 0; }

  /* REPORTS */
  .report-item {
    display: flex; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border);
    gap: 14px;
  }
  .report-icon { width: 40px; height: 40px; background: #fee2e2; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #dc2626; flex-shrink: 0; }
  .report-name { font-size: 13px; font-weight: 600; color: var(--navy); }
  .report-meta { font-size: 12px; color: var(--steel); }

  /* LAYOUT HELPERS */
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .section-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 14px; }
  .muted { color: var(--text-muted); font-size: 13px; }
  .search-bar {
    display: flex; align-items: center; gap: 8px; background: var(--bg);
    border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 12px;
    width: 240px;
  }
  .search-bar input { border: none; background: none; outline: none; font-size: 13px; font-family: 'Barlow', sans-serif; width: 100%; }
  .search-bar svg { color: var(--steel); width: 14px; height: 14px; flex-shrink: 0; }

  /* SUCCESS TOAST */
  .toast {
    position: fixed; bottom: 24px; right: 24px; background: var(--navy);
    color: #fff; padding: 14px 20px; border-radius: 10px; font-size: 14px; font-weight: 600;
    display: flex; align-items: center; gap: 10px; z-index: 200;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); border-left: 4px solid var(--accent);
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* Mobile: collapsible sidebar */
  .sidebar-toggle {
    display: none;
    background: none; border: none; padding: 8px; margin: 0 -8px 0 0;
    color: var(--navy); cursor: pointer; border-radius: 8px;
  }
  .sidebar-overlay {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    z-index: 250; opacity: 0; pointer-events: none; transition: opacity 0.2s;
  }
  .sidebar-overlay.active { opacity: 1; pointer-events: auto; }

  @media (max-width: 900px) {
    .sidebar {
      position: fixed; left: 0; top: 0; bottom: 0; z-index: 300;
      width: 260px; max-width: 85vw;
      transform: translateX(-100%); transition: transform 0.25s ease;
      box-shadow: none;
    }
    .sidebar.open {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0,0,0,0.2);
    }
    .sidebar-overlay { display: block; }
    .sidebar-toggle { display: flex; align-items: center; justify-content: center; }
    .main { min-width: 0; }
    .topbar { padding-left: 16px; padding-right: 16px; }
    .content { padding: 16px; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .kpi-grid { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
  }
`;

// ─── REAL QR CODE (scannable, encodes SKU or deep-link URL) ─────────────────────

function ItemQRCode({ sku, size = 80, useUrl = true }) {
  const base = typeof window !== "undefined"
    ? window.location.origin + (window.location.pathname || "/").replace(/\/$/, "") || ""
    : "";
  const value = useUrl && typeof window !== "undefined" && base
    ? `${base}#scan?sku=${encodeURIComponent(sku)}`
    : String(sku);
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      includeMargin={false}
      bgColor="#ffffff"
      fgColor="#181B2C"
    />
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast"><Check size={16} style={{ color: '#4ade80' }} />{message}</div>;
}

function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', sku: '', category: 'Fixings', unit: 'box', threshold: 5 });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add New Item</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Item Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Box of Screws (M8)" />
        </div>
        <div className="form-group">
          <label className="form-label">SKU Code</label>
          <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. DAL-016" />
        </div>
        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Fixings', 'Sealing', 'PPE', 'Electrical', 'Tools', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Unit</label>
            <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              {['box', 'roll', 'piece', 'pair', 'can', 'bag', 'set', 'length'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Low Stock Threshold</label>
          <input className="form-input" type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) })} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { if (form.name && form.sku) { onAdd(form); onClose(); } }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ item, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-header">
          <span className="modal-title">QR Label</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="qr-print-area">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>INVENTORY FLOW</div>
          <div className="qr-visual">
            <ItemQRCode sku={item.sku} size={140} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 4 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--steel)', fontWeight: 700, letterSpacing: 1 }}>{item.sku}</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--steel)', marginTop: 16, marginBottom: 16 }}>Print, laminate & mount on wall. Scanning opens the app and loads this item for logging—or use any QR reader to get the SKU.</p>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => window.print()}>
          <Printer size={14} /> Print & Laminate
        </button>
      </div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !pass) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (err) throw err;
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const hasSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">INVENTORY FLOW<span>.</span></div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, marginTop: 2 }}>STOCK MANAGER</div>
        <div className="login-sub">Sign in to manage construction inventory</div>
        {!hasSupabase && (
          <div className="alert alert-yellow" style={{ marginBottom: 16 }}>
            Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
          </div>
        )}
        {error && (
          <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>
        )}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@inventoryflow.ie" disabled={!hasSupabase} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={!hasSupabase} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px' }} onClick={handleSubmit} disabled={!hasSupabase || loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="login-footer">Powered by Supabase Auth · JWT Secured</div>
      </div>
    </div>
  );
}

function DashboardPage({ items, scannedToday: scannedTodayProp, totalItems: totalItemsProp }) {
  const itemList = items || MOCK_ITEMS;
  const lowStock = itemList.filter(i => i.lastCount <= i.threshold);
  const totalItems = totalItemsProp ?? itemList.length;
  const scannedToday = scannedTodayProp ?? Math.min(6, Math.floor(totalItems * 0.8));
  return (
    <div>
      <div className="stat-grid">
        {[
          { label: 'Total Items', value: String(totalItems), sub: '', icon: <Box />, accent: 'var(--navy-mid)' },
          { label: 'Scanned Today', value: String(scannedToday), sub: `${totalItems - scannedToday} remaining`, icon: <Scan />, accent: 'var(--accent)' },
          { label: 'Low Stock Alerts', value: String(lowStock.length), sub: 'Needs attention', icon: <AlertTriangle />, accent: '#dc2626' },
          { label: 'Reports This Week', value: '3', sub: 'Last: today 09:00', icon: <FileText />, accent: '#16a34a' },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ '--accent': s.accent }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.sub ? <div className="stat-sub">{s.sub}</div> : null}
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mb-6">
          {lowStock.slice(0, 2).map(item => (
            <div key={item.id} className={`alert ${item.lastCount <= 2 ? 'alert-red' : 'alert-yellow'}`}>
              <AlertTriangle size={16} />
              <strong>{item.name}</strong> — only {item.lastCount} {item.unit}s remaining (threshold: {item.threshold})
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Recent Scan Activity</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Count</th><th>By</th><th>Time</th></tr></thead>
              <tbody>
                {MOCK_LOGS.map(log => (
                  <tr key={log.id}>
                    <td><strong style={{ fontSize: 13 }}>{log.item}</strong><br /><span style={{ fontSize: 11, color: 'var(--steel)' }}>{log.sku}</span></td>
                    <td><strong>{log.count}</strong></td>
                    <td style={{ fontSize: 12 }}>{log.user.split(' ')[0]}</td>
                    <td><span className="tag tag-gray">{log.time}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Today's Audit Progress</div>
          <div style={{ marginBottom: 16 }}>
            <div className="flex justify-between mb-2" style={{ fontSize: 13 }}>
              <span>Items scanned today</span>
              <strong style={{ color: 'var(--accent)' }}>{scannedToday} / {totalItems}</strong>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${totalItems ? (scannedToday / totalItems) * 100 : 0}%` }} /></div>
          </div>
          <div>
            {itemList.slice(0, 8).map((item, i) => (
              <div key={item.id} className="flex items-center justify-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: i < scannedToday ? 'var(--text)' : 'var(--steel)' }}>{item.name}</span>
                {i < scannedToday
                  ? <span className="tag tag-green"><Check size={10} style={{ marginRight: 3 }} />Done</span>
                  : <span className="tag tag-gray">Pending</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSkuFromQrResult(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim().replace(/\s+/g, " ");
  const skuParam = trimmed.match(/[?&]sku=([^#&\s]+)/i) || trimmed.match(/#scan\?sku=([^&\s]+)/i);
  if (skuParam) return decodeURIComponent(skuParam[1]).trim();
  const dalMatch = trimmed.match(/\b(DAL-\d+)\b/i);
  if (dalMatch) return dalMatch[1].toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

function CameraScanner({ onResult, onCancel, itemList }) {
  const [error, setError] = useState(null);
  const [lastDetected, setLastDetected] = useState(null);
  const videoRef = useRef(null);
  const onResultRef = useRef(onResult);
  const itemListRef = useRef(itemList);
  onResultRef.current = onResult;
  itemListRef.current = itemList;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stream = null;
    let rafId = null;
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      if (video.srcObject) {
        video.srcObject = null;
      }
    };

    const startDecodeLoop = () => {
      const reader = new QRCodeReader();
      const captureCanvas = document.createElement("canvas");
      const captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true });
      if (!captureCtx) return;

      let frameCount = 0;
      const tryDecode = () => {
        if (cancelled || !video.srcObject || !stream) return;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) {
          rafId = requestAnimationFrame(tryDecode);
          return;
        }
        captureCanvas.width = w;
        captureCanvas.height = h;
        captureCtx.drawImage(video, 0, 0, w, h, 0, 0, w, h);
        frameCount += 1;
        if (frameCount % 2 === 0) {
          try {
            const luminanceSource = new HTMLCanvasElementLuminanceSource(captureCanvas);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            const result = reader.decode(binaryBitmap);
            if (result) {
              const raw = result.getText();
              const sku = parseSkuFromQrResult(raw);
              const list = itemListRef.current || [];
              if (sku) {
                const item = list.find((i) => i.sku.toUpperCase() === sku.toUpperCase());
                if (item) {
                  cleanup();
                  onResultRef.current(item);
                  return;
                }
              }
              setLastDetected((raw && raw.length > 40 ? raw.slice(0, 40) + "…" : raw) || "");
            }
          } catch (_) {
            // No code in frame
          }
        }
        if (!cancelled) rafId = requestAnimationFrame(tryDecode);
      };
      rafId = requestAnimationFrame(tryDecode);
    };

    const playVideo = () =>
      video.play().catch((err) => {
        if (err?.name === "AbortError" || /interrupted|load request/i.test(err?.message ?? "")) {
          return video.play();
        }
        throw err;
      });

    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      },
      audio: false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        video.srcObject = s;
        video.muted = true;
        video.playsInline = true;
        return new Promise((resolve, reject) => {
          let settled = false;
          const onReady = () => {
            if (settled) return;
            video.removeEventListener("loadedmetadata", onReady);
            video.removeEventListener("canplay", onReady);
            settled = true;
            playVideo().then(resolve).catch(reject);
          };
          if (video.videoWidth > 0) {
            playVideo().then(resolve).catch(reject);
          } else {
            video.addEventListener("loadedmetadata", onReady);
            video.addEventListener("canplay", onReady);
          }
        });
      })
      .then(() => {
        if (!cancelled) startDecodeLoop();
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Camera access failed");
      });

    return cleanup;
  }, []);

  return (
    <div>
      <div className="scan-viewfinder" style={{ position: "relative" }}>
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
          muted
          playsInline
          autoPlay
        />
        <div className="scan-corner tl" /><div className="scan-corner tr" />
        <div className="scan-corner bl" /><div className="scan-corner br" />
        <div className="scan-line" />
      </div>
      {error && (
        <div className="alert alert-red" style={{ marginTop: 12 }}>{error}</div>
      )}
      {lastDetected && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
          Detected: {lastDetected}
        </div>
      )}
      <div className="card" style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--steel)" }}>Point camera at QR code</div>
        <div style={{ fontSize: 12, color: "var(--steel-light)", marginTop: 4 }}>Hold steady over the label</div>
        <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ScanPage({ items, initialSku, onToast, onScanLogged }) {
  const itemList = items || MOCK_ITEMS;
  const resolvedItem = initialSku ? itemList.find(i => i.sku.toUpperCase() === initialSku.toUpperCase()) : null;
  const [step, setStep] = useState(resolvedItem ? 'counting' : 'idle'); // idle | scanning | counting | done
  const [scannedItem, setScannedItem] = useState(resolvedItem);
  const [count, setCount] = useState(resolvedItem ? resolvedItem.lastCount : 0);
  const [notes, setNotes] = useState('');

  const startCameraScan = () => {
    setStep('scanning');
  };

  const handleCameraResult = (item) => {
    setScannedItem(item);
    setCount(item.lastCount || 0);
    setStep('counting');
  };

  const submitCount = () => {
    setStep('done');
    if (onScanLogged) onScanLogged();
    onToast(`✓ ${scannedItem.name} — ${count} ${scannedItem.unit}s logged`);
    setTimeout(() => { setStep('idle'); setScannedItem(null); setNotes(''); }, 1500);
  };

  return (
    <div className="scan-container">
      {step === 'idle' && (
        <>
          <div className="card mb-4" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: 80, height: 80, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent)' }}>
              <Camera size={32} />
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Ready to Scan</div>
            <p style={{ fontSize: 13, color: 'var(--steel)', marginBottom: 24 }}>Point your camera at a QR code label mounted on the wall to begin logging stock.</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={startCameraScan}>
              <Scan size={16} /> Activate Camera & Scan
            </button>
            <p style={{ fontSize: 11, color: 'var(--steel)', marginTop: 12 }}>No camera? Use &quot;Quick Scan&quot; below or allow camera access when prompted.</p>
          </div>
          <div className="card">
            <div className="section-title" style={{ fontSize: 15 }}>Quick Scan — Select Item</div>
            <p style={{ fontSize: 12, color: 'var(--steel)', marginBottom: 12 }}>Or tap an item below to log without scanning:</p>
            {(items || MOCK_ITEMS).slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => { setScannedItem(item); setCount(item.lastCount); setStep('counting'); }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--steel)' }}>{item.sku} · Last: {item.lastCount} {item.unit}s</div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--steel)' }} />
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'scanning' && (
        <CameraScanner
          itemList={itemList}
          onResult={handleCameraResult}
          onCancel={() => setStep('idle')}
        />
      )}

      {step === 'counting' && scannedItem && (
        <div>
          <div className="scan-result-card">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--accent-light)', marginBottom: 6 }}>✓ QR CODE DETECTED</div>
            <div className="scan-item-name">{scannedItem.name}</div>
            <div className="scan-item-sku">{scannedItem.sku} · {scannedItem.category} · per {scannedItem.unit}</div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Last logged count: {scannedItem.lastCount} {scannedItem.unit}s</div>
          </div>
          <div className="card mb-4">
            <div className="section-title" style={{ fontSize: 16 }}>Enter Today's Count</div>
            <div className="count-input-wrap">
              <button className="count-btn" onClick={() => setCount(Math.max(0, count - 1))}>−</button>
              <div className="count-display">{count}</div>
              <button className="count-btn" onClick={() => setCount(count + 1)}>+</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[1, 5, 10, 25, 50, 100].map(n => (
                <button key={n} className="btn btn-ghost btn-sm" onClick={() => setCount(n)} style={{ fontWeight: 700 }}>{n}</button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Low stock — reorder needed" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('idle')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={submitCount}>
              <Check size={14} /> Log {count} {scannedItem.unit}s
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
            <CheckCircle size={32} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>Logged Successfully</div>
        </div>
      )}
    </div>
  );
}

function ItemsPage({ items, onAddItem, onToast }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(null);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryTag = (cat) => {
    const map = { Fixings: 'tag-blue', PPE: 'tag-blue-accent', Sealing: 'tag-green', Electrical: 'tag-purple', Tools: 'tag-gray' };
    return map[cat] || 'tag-gray';
  };

  const stockStatus = (item) => {
    if (item.lastCount <= 2) return { cls: 'stock-critical', label: `${item.lastCount} ⚠ Critical` };
    if (item.lastCount <= item.threshold) return { cls: 'stock-low', label: `${item.lastCount} ↓ Low` };
    return { cls: 'stock-ok', label: `${item.lastCount} ✓` };
  };

  return (
    <div>
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={(item) => { onAddItem(item); onToast(`${item.name} added to inventory`); }} />}
      {showQR && <QRModal item={showQR} onClose={() => setShowQR(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div className="search-bar">
          <Search /><input placeholder="Search items or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>SKU</th><th>Category</th><th>Unit</th>
                <th>Stock Count</th><th>Last Logged</th><th>QR Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const status = stockStatus(item);
                return (
                  <tr key={item.id}>
                    <td><strong style={{ fontSize: 13 }}>{item.name}</strong></td>
                    <td><code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{item.sku}</code></td>
                    <td><span className={`tag ${getCategoryTag(item.category)}`}>{item.category}</span></td>
                    <td style={{ color: 'var(--steel)', fontSize: 13 }}>{item.unit}</td>
                    <td><span className={status.cls}>{status.label}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--steel)' }}>{item.lastLogged}</td>
                    <td>
                      <button className="btn-icon" onClick={() => setShowQR(item)} title="View & Print QR">
                        <QrCode size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QRPage({ items }) {
  const [showQR, setShowQR] = useState(null);
  return (
    <div>
      {showQR && <QRModal item={showQR} onClose={() => setShowQR(null)} />}
      <div className="alert alert-green mb-6" style={{ marginBottom: 20 }}>
        <Printer size={16} />
        Click any item below to view its QR code — then print, laminate and mount on your wall for instant scanning.
      </div>
      <div className="qr-grid">
        {items.map(item => (
          <div key={item.id} className="qr-card" onClick={() => setShowQR(item)}>
            <div className="qr-code-area">
              <ItemQRCode sku={item.sku} size={80} />
            </div>
            <div className="qr-item-name">{item.name}</div>
            <div className="qr-sku">{item.sku}</div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>
              <Eye size={11} /> View & Print
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatReportDate(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function downloadReport(report, items) {
  const doc = new jsPDF();
  const itemList = items || [];
  const lowStock = itemList.filter(i => i.lastCount <= i.threshold);

  doc.setFontSize(18);
  doc.text(report.name, 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${report.date} · by ${report.by} · ${report.items} items`, 14, 30);
  doc.setTextColor(0, 0, 0);

  const tableData = itemList.map(i => [
    i.name,
    i.sku,
    String(i.lastCount),
    String(i.threshold),
    i.lastCount <= i.threshold ? 'Low' : 'OK',
  ]);

  doc.autoTable({
    startY: 38,
    head: [['Item', 'SKU', 'Count', 'Threshold', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [24, 27, 44], fontSize: 9 },
    styles: { fontSize: 9 },
    columnStyles: {
      4: { cellWidth: 24, cellPadding: 3 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4 && data.cell.raw === 'Low') {
        data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  let finalY = doc.lastAutoTable.finalY || 38;

  if (lowStock.length > 0) {
    finalY += 10;
    if (finalY > 250) { doc.addPage(); finalY = 20; }
    doc.setFontSize(12);
    doc.text(`Low Stock Alerts (${lowStock.length})`, 14, finalY);
    finalY += 8;
    lowStock.forEach((i, idx) => {
      if (finalY > 270) { doc.addPage(); finalY = 20; }
      doc.setFontSize(9);
      doc.text(`${i.name} (${i.sku}) — ${i.lastCount} ${i.unit}s remaining (min: ${i.threshold})`, 14, finalY);
      finalY += 6;
    });
  }

  doc.save(report.name.replace(/\s+/g, '-') + '.pdf');
}

function ReportsPage({ items, reports, onAddReport, onToast }) {
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  const filteredReports = reports.filter(r => {
    const d = r.dateObj || new Date(r.date);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59);
    return d >= from && d <= to;
  });

  const handleGenerateToday = () => {
    const now = new Date();
    const report = {
      id: 'r' + Date.now(),
      name: `Daily Stock Report — ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      date: formatReportDate(now),
      by: "Seán Murphy",
      items: (items || []).length,
      dateObj: now,
    };
    onAddReport(report);
    downloadReport(report, items);
    onToast('Report generated and downloaded');
  };

  const handleExportRange = () => {
    const now = new Date();
    const report = {
      id: 'r' + Date.now(),
      name: `Range Report ${fromDate} to ${toDate}`,
      date: formatReportDate(now),
      by: "Seán Murphy",
      items: (items || []).length,
      dateObj: now,
    };
    onAddReport(report);
    downloadReport(report, items);
    onToast(`Range report (${fromDate} to ${toDate}) generated and downloaded`);
  };

  const handleDownload = (r) => {
    downloadReport(r, items);
    onToast(`Downloaded: ${r.name}`);
  };

  return (
    <div>
      <div className="grid-2 mb-6">
        <div className="card" style={{ background: 'var(--navy)', color: '#fff', border: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Generate New Report</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Daily Stock Audit PDF</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Generate a full PDF report of today's stock counts and low stock alerts.</p>
          <button className="btn btn-primary" onClick={handleGenerateToday}>
            <FileText size={14} /> Generate Today's Report
          </button>
        </div>
        <div className="card">
          <div className="section-title">Date Range Export</div>
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportRange}>
            <Download size={14} /> Export Range as PDF
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Saved Reports {fromDate && toDate ? `— ${filteredReports.length} in range ${fromDate} to ${toDate}` : ''}</div>
        {filteredReports.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--steel)', fontSize: 14 }}>No reports in this date range. Adjust the filters above or generate a new report.</div>
        ) : (
          filteredReports.map((r) => (
            <div key={r.id || r.name} className="report-item">
              <div className="report-icon"><FileText size={18} /></div>
              <div style={{ flex: 1 }}>
                <div className="report-name">{r.name}</div>
                <div className="report-meta">{r.date} · by {r.by} · {r.items} items logged</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(r)}><Download size={12} /> Download</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KPIPage({ items, scannedToday: scannedTodayProp, totalItems: totalItemsProp }) {
  const itemList = items || MOCK_ITEMS;
  const totalItems = totalItemsProp ?? itemList.length;
  const scannedToday = scannedTodayProp ?? Math.min(6, Math.floor(totalItems * 0.8));
  const completionPct = totalItems ? Math.round((scannedToday / totalItems) * 100) : 0;

  return (
    <div>
      {/* TOP KPI CARDS */}
      <div className="stat-grid mb-6">
        {[
          { label: 'Audit Completion', value: `${completionPct}%`, sub: `${scannedToday} of ${totalItems} items`, accent: completionPct >= 80 ? '#16a34a' : '#ca8a04', icon: <Activity /> },
          { label: 'Total Scans Today', value: '25', sub: 'Across 3 staff', accent: 'var(--accent)', icon: <Scan /> },
          { label: 'Avg Scans/Day', value: '31', sub: 'Last 30 days', accent: 'var(--navy-mid)', icon: <TrendingUp /> },
          { label: 'Items Never Logged', value: '0', sub: 'All items active', accent: '#16a34a', icon: <CheckCircle /> },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ '--accent': s.accent }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* USER PERFORMANCE */}
      <div className="section-title">Staff Performance</div>
      <div className="kpi-grid mb-6">
        {MOCK_USERS.map((user, i) => (
          <div key={user.id} className="kpi-user-card">
            <div className="kpi-avatar" style={{ background: i === 0 ? 'var(--accent)' : 'var(--navy)' }}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div className="kpi-name">{user.name}</div>
              <div className="kpi-meta">{user.role === 'admin' ? '⭐ Admin' : 'Staff'}</div>
              <div className="flex items-center gap-3 mt-1">
                <div style={{ fontSize: 11, color: 'var(--steel)' }}>Today</div>
                <div className="kpi-scans">{user.scansToday}</div>
                <div style={{ fontSize: 11, color: 'var(--steel)' }}>Month</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>{user.scansMonth}</div>
              </div>
            </div>
            {i === 0 && <div style={{ fontSize: 20 }}>🏆</div>}
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title">Stock Trends (7 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="screws" stroke="#1e3a5f" strokeWidth={2} dot={false} name="Screws" />
              <Line type="monotone" dataKey="tape" stroke="#00A1E5" strokeWidth={2} dot={false} name="Tape" />
              <Line type="monotone" dataKey="helmets" stroke="#22c55e" strokeWidth={2} dot={false} name="Helmets" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Scans Per Week</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SCAN_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="scans" fill="var(--navy-mid)" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="section-title">Inventory by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Low Stock Items</div>
          {itemList.filter(i => i.lastCount <= i.threshold).map(item => (
            <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--steel)' }}>{item.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={item.lastCount <= 2 ? 'stock-critical' : 'stock-low'} style={{ fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 }}>
                    {item.lastCount}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--steel)' }}>/ {item.threshold} min</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: 6 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (item.lastCount / item.threshold) * 100)}%`, background: item.lastCount <= 2 ? '#dc2626' : '#ca8a04' }} />
              </div>
            </div>
          ))}
          {itemList.filter(i => i.lastCount <= i.threshold).length === 0 && (
            <div className="alert alert-green"><CheckCircle size={16} /> All items are above threshold</div>
          )}
        </div>
      </div>

      {/* ACTIVITY LOG */}
      <div className="card">
        <div className="section-title">Full Activity Log</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>SKU</th><th>User</th><th>Count</th><th>Date</th><th>Time</th></tr></thead>
            <tbody>
              {MOCK_LOGS.map(log => (
                <tr key={log.id}>
                  <td><strong style={{ fontSize: 13 }}>{log.item}</strong></td>
                  <td><code style={{ fontSize: 11, background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>{log.sku}</code></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 24, height: 24, background: 'var(--navy)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {log.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontSize: 13 }}>{log.user}</span>
                    </div>
                  </td>
                  <td><strong>{log.count}</strong></td>
                  <td style={{ fontSize: 12, color: 'var(--steel)' }}>{log.date}</td>
                  <td><span className="tag tag-gray">{log.time}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layers />, section: 'main' },
  { id: 'scan', label: 'Scan & Log', icon: <Scan />, section: 'main' },
  { id: 'items', label: 'Inventory', icon: <Package />, section: 'main' },
  { id: 'qrcodes', label: 'QR Codes', icon: <QrCode />, section: 'main' },
  { id: 'reports', label: 'Reports', icon: <FileText />, section: 'reports' },
  { id: 'kpi', label: 'KPI Tracker', icon: <BarChart3 />, section: 'reports' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard', scan: 'Scan & Log Stock', items: 'Inventory Management',
  qrcodes: 'QR Codes', reports: 'Reports', kpi: 'KPI Tracker',
};

function parseScanHash() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash || !hash.startsWith("#scan")) return null;
  const params = new URLSearchParams(hash.split("?")[1] || "");
  return params.get("sku");
}

const SCANNED_STORAGE_KEY = "inventory-flow-scanned";
function getIrishDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Dublin", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/-/g, "");
}
function getScannedTodayFromStorage() {
  if (typeof window === "undefined") return 0;
  const key = SCANNED_STORAGE_KEY + getIrishDateString();
  const v = localStorage.getItem(key);
  return v ? parseInt(v, 10) : 0;
}
function incrementScannedTodayStorage() {
  const dateKey = getIrishDateString();
  const key = SCANNED_STORAGE_KEY + dateKey;
  const prev = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, String(prev + 1));
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [toast, setToast] = useState(null);
  const [initialSku, setInitialSku] = useState(null);
  const [irishDateKey, setIrishDateKey] = useState(() => (typeof window !== "undefined" ? getIrishDateString() : ""));
  const [scannedToday, setScannedToday] = useState(() => getScannedTodayFromStorage());
  const [reports, setReports] = useState([
    { id: 'r1', name: "Daily Stock Report — 04 Mar 2026", date: "04 Mar 2026, 09:00", by: "Seán Murphy", items: 12, dateObj: new Date(2026, 2, 4, 9, 0) },
    { id: 'r2', name: "Daily Stock Report — 03 Mar 2026", date: "03 Mar 2026, 08:45", by: "Aoife Kelly", items: 15, dateObj: new Date(2026, 2, 3, 8, 45) },
    { id: 'r3', name: "Daily Stock Report — 02 Mar 2026", date: "02 Mar 2026, 09:12", by: "Seán Murphy", items: 10, dateObj: new Date(2026, 2, 2, 9, 12) },
    { id: 'r4', name: "Weekly Summary — W9 2026", date: "28 Feb 2026, 17:00", by: "Seán Murphy", items: 50, dateObj: new Date(2026, 1, 28, 17, 0) },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sku = parseScanHash();
    if (sku) {
      setPage('scan');
      setInitialSku(sku);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (page !== 'scan') setInitialSku(null);
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getIrishDateString();
      if (next !== irishDateKey) {
        setIrishDateKey(next);
        setScannedToday(getScannedTodayFromStorage());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [irishDateKey]);

  const handleScanLogged = () => {
    incrementScannedTodayStorage();
    setScannedToday(getScannedTodayFromStorage());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="login-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#fff', fontSize: 16 }}>Loading...</div>
        </div>
      </>
    );
  }

  if (!session) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />
    </>
  );

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">INVENTORY FLOW</div>
            <div className="logo-sub">Stock Manager</div>
          </div>
          <nav className="sidebar-nav">
            {sections.map(sec => (
              <div key={sec}>
                <div className="nav-section">{sec}</div>
                {NAV.filter(n => n.section === sec).map(n => (
                  <div
                    key={n.id}
                    className={`nav-item ${page === n.id ? 'active' : ''}`}
                    onClick={() => { setPage(n.id); setSidebarOpen(false); }}
                  >
                    {n.icon}{n.label}
                    {n.id === 'scan' && <span className="badge" style={{ marginLeft: 'auto', fontSize: 9 }}>LIVE</span>}
                    {n.id === 'kpi' && <span className="badge" style={{ marginLeft: 'auto', fontSize: 9, background: '#16a34a' }}>KPI</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-user">
            <div className="user-avatar">
              {(session?.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}</div>
              <div className="user-role">{session?.user?.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out"><LogOut size={14} /></button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
            <div>
              <div className="topbar-title">{PAGE_TITLES[page]}</div>
              <div className="topbar-breadcrumb">Inventory Flow · {PAGE_TITLES[page]}</div>
            </div>
            <div className="topbar-right">
              <div className="date-chip">📅 Wed 4 Mar 2026</div>
              {page === 'scan' && (
                <div className="flex items-center gap-2" style={{ background: '#dcfce7', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#166534' }}>
                  <div style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                  Camera Ready
                </div>
              )}
            </div>
          </div>

          <div className="content">
            {page === 'dashboard' && <DashboardPage items={items} scannedToday={scannedToday} totalItems={items.length} />}
            {page === 'scan' && <ScanPage items={items} initialSku={initialSku} onToast={(msg) => setToast(msg)} onScanLogged={handleScanLogged} />}
            {page === 'items' && <ItemsPage items={items} onAddItem={(item) => setItems([...items, { ...item, id: String(items.length + 1), lastCount: 0, lastLogged: '—' }])} onToast={(msg) => setToast(msg)} />}
            {page === 'qrcodes' && <QRPage items={items} />}
            {page === 'reports' && <ReportsPage items={items} reports={reports} onAddReport={(r) => setReports(prev => [r, ...prev])} onToast={(msg) => setToast(msg)} />}
            {page === 'kpi' && <KPIPage items={items} scannedToday={scannedToday} totalItems={items.length} />}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
