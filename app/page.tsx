"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Filter,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from "lucide-react";

type Status = "Open" | "In progress" | "Escalated" | "Resolved";
type Complaint = {
  id: string;
  title: string;
  category: string;
  ward: string;
  status: Status;
  priority: "High" | "Medium" | "Low";
  reports: number;
  time: string;
};

const initialComplaints: Complaint[] = [
  { id: "CR-1042", title: "Streetlight not working near 5th Cross", category: "Electricity", ward: "Ward 7", status: "Open", priority: "High", reports: 14, time: "12 min ago" },
  { id: "CR-1041", title: "Garbage collection missed this morning", category: "Sanitation", ward: "Ward 3", status: "In progress", priority: "Medium", reports: 8, time: "38 min ago" },
  { id: "CR-1040", title: "Pothole on 80 Feet Road", category: "Roads", ward: "Ward 11", status: "Escalated", priority: "High", reports: 23, time: "1 hr ago" },
  { id: "CR-1039", title: "Water leakage beside community hall", category: "Water supply", ward: "Ward 2", status: "Resolved", priority: "Low", reports: 5, time: "2 hrs ago" }
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Complaints", icon: ClipboardList },
  { label: "Map view", icon: MapPin },
  { label: "Residents", icon: Users },
  { label: "Reports", icon: Activity }
];

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status.toLowerCase().replace(" ", "-")}`}><span />{status}</span>;
}

export default function Home() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState("");

  const filteredComplaints = useMemo(
    () => complaints.filter((item) => `${item.id} ${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [complaints, query]
  );

  function resolveComplaint(id: string) {
    setComplaints((items) => items.map((item) => item.id === id ? { ...item, status: "Resolved" } : item));
    setToast(`${id} marked as resolved`);
    window.setTimeout(() => setToast(""), 2500);
  }

  function submitComplaint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "New civic complaint");
    setComplaints((items) => [{
      id: `CR-${1043 + items.length}`,
      title,
      category: String(form.get("category") || "General"),
      ward: "Ward 7",
      status: "Open",
      priority: "Medium",
      reports: 1,
      time: "Just now"
    }, ...items]);
    setShowForm(false);
    setToast("Complaint submitted and routed by CivicResolve");
    window.setTimeout(() => setToast(""), 2500);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><ShieldCheck size={21} /></div><span>Civic<span>Resolve</span></span></div>
        <div className="workspace"><div className="avatar">UL</div><div><strong>Urban Local Body</strong><small>Administration</small></div><ChevronDown size={15} /></div>
        <nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? "nav-item active" : "nav-item"} onClick={() => setActiveNav(label)}><Icon size={18} />{label}{label === "Complaints" && <em>24</em>}</button>)}</nav>
        <div className="sidebar-bottom"><button className="nav-item"><Settings size={18} />Settings</button><button className="nav-item"><CircleHelp size={18} />Help centre</button><div className="profile"><div className="avatar profile-avatar">AS</div><div><strong>Aadish Sarin</strong><small>Administrator</small></div><MoreHorizontal size={17} /></div></div>
      </aside>
      <section className="content">
        <header className="topbar"><button className="mobile-menu"><Menu size={21} /></button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div><div className="top-actions"><div className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaints..." /></div><button className="icon-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={19} /><i /></button><div className="avatar profile-avatar">AS</div></div>{showNotifications && <div className="notification-popover"><strong>Notifications</strong><p><AlertTriangle size={15} /> 3 complaints need escalation</p><p><CheckCircle2 size={15} /> CR-1039 was resolved</p></div>}</header>
        <div className="page">
          <div className="page-heading"><div><p className="eyebrow">Tuesday, 10 November 2026</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18} /> New complaint</button></div>
          {activeNav !== "Overview" ? <section className="panel section-page">
            <div className="panel-heading"><div><h2>{activeNav}</h2><p>{activeNav === "Map view" ? "Explore complaint hotspots by ward." : activeNav === "Residents" ? "Resident accounts and engagement overview." : activeNav === "Reports" ? "Performance reports for your administration." : "Manage, filter, and resolve civic complaints."}</p></div><button className="primary-button" onClick={() => setShowForm(true)}><Plus size={16} /> New complaint</button></div>
            {activeNav === "Complaints" && <div className="complaint-list">{filteredComplaints.map((item) => <div className="complaint-row" key={item.id}><div className="complaint-id">{item.id}<small>{item.time}</small></div><div className="complaint-title"><strong>{item.title}</strong><small><span className="category-dot" />{item.category} <b>·</b> {item.ward}</small></div><div><StatusBadge status={item.status} /><small className="reports"><MessageSquareText size={13} /> {item.reports} reports</small></div><button className="row-menu" onClick={() => resolveComplaint(item.id)} title="Mark resolved"><CheckCircle2 size={18} /></button></div>)}</div>}
            {activeNav === "Map view" && <div className="map-placeholder large-map"><div className="map-road r1" /><div className="map-road r2" /><div className="map-road r3" /><div className="map-pin pin1"><MapPin size={24} /></div><div className="map-pin pin2"><MapPin size={24} /></div><div className="map-pin pin3"><MapPin size={24} /></div><span className="map-label label1">Ward 7 · 38 complaints</span><span className="map-label label2">Ward 11 · 23 complaints</span><span className="map-label label3">Ward 3 · 19 complaints</span></div>}
            {activeNav === "Residents" && <div className="stats-grid inner-stats"><article className="stat-card"><div className="stat-icon blue"><Users size={19} /></div><div><span>Registered residents</span><strong>8,642</strong><small className="positive">↑ 6.8% this month</small></div></article><article className="stat-card"><div className="stat-icon green"><MessageSquareText size={19} /></div><div><span>Active reporters</span><strong>3,218</strong><small className="positive">↑ 12.1% this month</small></div></article></div>}
            {activeNav === "Reports" && <div className="stats-grid inner-stats"><article className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19} /></div><div><span>Resolved this month</span><strong>438</strong><small className="positive">82.1% resolution rate</small></div></article><article className="stat-card"><div className="stat-icon amber"><AlertTriangle size={19} /></div><div><span>Past SLA</span><strong>27</strong><small className="negative">Needs attention</small></div></article></div>}
          </section> : <>
          <div className="stats-grid">
            <article className="stat-card"><div className="stat-icon blue"><ClipboardList size={19} /></div><div><span>Total complaints</span><strong>1,284</strong><small className="positive">↑ 12.5% <label>vs last month</label></small></div><ArrowUpRight className="stat-arrow" size={18} /></article>
            <article className="stat-card"><div className="stat-icon amber"><AlertTriangle size={19} /></div><div><span>Open complaints</span><strong>247</strong><small className="negative">↑ 4.2% <label>vs last week</label></small></div><ArrowUpRight className="stat-arrow" size={18} /></article>
            <article className="stat-card"><div className="stat-icon violet"><Sparkles size={19} /></div><div><span>Auto-deduplicated</span><strong>68.4%</strong><small className="positive">↑ 8.7% <label>this month</label></small></div><ArrowUpRight className="stat-arrow" size={18} /></article>
            <article className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19} /></div><div><span>Resolution rate</span><strong>82.1%</strong><small className="positive">↑ 3.1% <label>vs last month</label></small></div><ArrowUpRight className="stat-arrow" size={18} /></article>
          </div>
          <div className="dashboard-grid">
            <section className="panel complaints-panel"><div className="panel-heading"><div><h2>Recent complaints</h2><p>Latest reports from residents</p></div><button className="text-button" onClick={() => setActiveNav("Complaints")}>View all <ArrowUpRight size={15} /></button></div><div className="table-tools"><div className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter complaints..." /></div><button className="filter-button"><Filter size={15} /> Filters</button></div><div className="complaint-list">{filteredComplaints.map((item) => <div className="complaint-row" key={item.id}><div className="complaint-id">{item.id}<small>{item.time}</small></div><div className="complaint-title"><strong>{item.title}</strong><small><span className="category-dot" />{item.category} <b>·</b> {item.ward}</small></div><div><StatusBadge status={item.status} /><small className="reports"><MessageSquareText size={13} /> {item.reports} reports</small></div><button className="row-menu" onClick={() => resolveComplaint(item.id)} title="Mark resolved"><CheckCircle2 size={18} /></button></div>)}{filteredComplaints.length === 0 && <div className="empty-state">No complaints match your search.</div>}</div></section>
            <section className="panel activity-panel"><div className="panel-heading"><div><h2>Activity overview</h2><p>Complaint volume this week</p></div><button className="period-button">This week <ChevronDown size={14} /></button></div><div className="chart"><div className="chart-y"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 360 160" preserveAspectRatio="none" aria-label="Complaint activity chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5b7cfa" stopOpacity=".25" /><stop offset="1" stopColor="#5b7cfa" stopOpacity="0" /></linearGradient></defs><path d="M0 115 C25 95 35 112 55 90 S90 95 108 70 S145 85 165 58 S205 72 225 48 S260 67 280 42 S320 52 360 22 V160 H0Z" fill="url(#fill)" /><path d="M0 115 C25 95 35 112 55 90 S90 95 108 70 S145 85 165 58 S205 72 225 48 S260 67 280 42 S320 52 360 22" fill="none" stroke="#5879f4" strokeWidth="3" /></svg><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div><div className="chart-legend"><span><i className="legend-blue" />Complaints received</span><span><i className="legend-grey" />Complaints resolved</span></div></section>
          </div>
          <div className="lower-grid"><section className="panel category-panel"><div className="panel-heading"><div><h2>Complaints by category</h2><p>Distribution across departments</p></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="category-chart"><div className="donut"><div><strong>1,284</strong><small>Total</small></div></div><div className="category-legend"><span><i className="c-blue" />Roads <b>34%</b></span><span><i className="c-purple" />Sanitation <b>26%</b></span><span><i className="c-orange" />Water supply <b>21%</b></span><span><i className="c-green" />Electricity <b>19%</b></span></div></div></section><section className="panel map-panel"><div className="panel-heading"><div><h2>Complaint hotspots</h2><p>Areas with the highest reports</p></div><button className="text-button">Open map <ArrowUpRight size={15} /></button></div><div className="map-placeholder"><div className="map-road r1" /><div className="map-road r2" /><div className="map-road r3" /><div className="map-pin pin1"><MapPin size={20} /></div><div className="map-pin pin2"><MapPin size={20} /></div><div className="map-pin pin3"><MapPin size={20} /></div><span className="map-label label1">Ward 7</span><span className="map-label label2">Ward 11</span><span className="map-label label3">Ward 3</span></div></section></div></>}
        </div>
      </section>
      {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><h2>Submit a complaint</h2><p>Our AI will detect duplicates and route it automatically.</p></div><button className="icon-button" onClick={() => setShowForm(false)}><X size={19} /></button></div><form onSubmit={submitComplaint}><label>Complaint title<input name="title" required placeholder="e.g. Broken streetlight near..." /></label><label>Category<select name="category" defaultValue="Roads"><option>Roads</option><option>Sanitation</option><option>Water supply</option><option>Electricity</option></select></label><label>Description<textarea name="description" required placeholder="Describe the issue and its location..." rows={4} /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Sparkles size={16} /> Submit & route</button></div></form></div></div>}
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </main>
  );
}
