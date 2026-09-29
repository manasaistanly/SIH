"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Plane,
  Database,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Lock,
  Layers,
  Activity
} from "lucide-react";
import { api, DataSourceItem, AdminUserItem, RoleItem } from "@/lib/api";

type AdminConfigTab = "USERS" | "ROLES" | "ROUTES" | "DATA_SOURCES";

interface AdminConfigSectionProps {
  onNotify?: (msg: string) => void;
}

export function AdminConfigSection({ onNotify }: AdminConfigSectionProps) {
  const [activeTab, setActiveTab] = useState<AdminConfigTab>("USERS");
  const [loading, setLoading] = useState(false);

  // Data states
  const [users, setUsers] = useState<AdminUserItem[]>([
    {
      id: "u-1",
      email: "admin@rtapip.in",
      full_name: "National System Administrator",
      role: "ADMIN",
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "u-2",
      email: "analyst@rtapip.in",
      full_name: "Senior Aviation Econometrician",
      role: "DATA_ANALYST",
      is_active: true,
      last_login: new Date(Date.now() - 3600000).toISOString(),
      created_at: "2024-01-05T00:00:00Z"
    },
    {
      id: "u-3",
      email: "moca.policy@gov.in",
      full_name: "Civil Aviation Policy Director",
      role: "POLICY_ANALYST",
      is_active: true,
      last_login: new Date(Date.now() - 86400000).toISOString(),
      created_at: "2024-01-10T00:00:00Z"
    },
    {
      id: "u-4",
      email: "viewer@rtapip.in",
      full_name: "Public Portal Auditor",
      role: "VIEWER",
      is_active: true,
      last_login: null,
      created_at: "2024-02-01T00:00:00Z"
    }
  ]);

  const [roles, setRoles] = useState<RoleItem[]>([
    {
      role_key: "SUPER_ADMIN",
      role_name: "National Governance Admin",
      description: "Master access across users, data pipelines, route basket, and official calibration.",
      can_manage_users: true,
      can_configure_routes: true,
      can_trigger_pipeline: true,
      can_calibrate_dgca: true,
      can_export_raw_data: true
    },
    {
      role_key: "ADMIN",
      role_name: "Institutional System Admin",
      description: "Manage ingestion configurations, route topology, and monitor gate validation health.",
      can_manage_users: true,
      can_configure_routes: true,
      can_trigger_pipeline: true,
      can_calibrate_dgca: true,
      can_export_raw_data: true
    },
    {
      role_key: "DATA_ANALYST",
      role_name: "Aviation Econometrician",
      description: "Inspect price indices, run DGCA backtest models, export datasets, and trace anomaly roots.",
      can_manage_users: false,
      can_configure_routes: false,
      can_trigger_pipeline: true,
      can_calibrate_dgca: true,
      can_export_raw_data: true
    },
    {
      role_key: "POLICY_ANALYST",
      role_name: "MoCA Policy Specialist",
      description: "Access price indices, attribution models, sector-wise heatmaps, and formal export reports.",
      can_manage_users: false,
      can_configure_routes: false,
      can_trigger_pipeline: false,
      can_calibrate_dgca: false,
      can_export_raw_data: true
    },
    {
      role_key: "VIEWER",
      role_name: "Public & Passenger Station",
      description: "Public access to real-time airfare index, advance yield variations, and fare decision support.",
      can_manage_users: false,
      can_configure_routes: false,
      can_trigger_pipeline: false,
      can_calibrate_dgca: false,
      can_export_raw_data: false
    }
  ]);

  const [routes, setRoutes] = useState<Array<{
    route_code: string;
    origin: string;
    destination: string;
    distance_km: number;
    category: string;
    weight: number;
    is_active: boolean;
  }>>([
    { route_code: "DEL-BOM", origin: "Delhi (DEL)", destination: "Mumbai (BOM)", distance_km: 1148, category: "METRO_METRO", weight: 0.25, is_active: true },
    { route_code: "DEL-BLR", origin: "Delhi (DEL)", destination: "Bengaluru (BLR)", distance_km: 1740, category: "METRO_METRO", weight: 0.20, is_active: true },
    { route_code: "BOM-BLR", origin: "Mumbai (BOM)", destination: "Bengaluru (BLR)", distance_km: 842, category: "METRO_METRO", weight: 0.18, is_active: true },
    { route_code: "DEL-CCU", origin: "Delhi (DEL)", destination: "Kolkata (CCU)", distance_km: 1305, category: "METRO_METRO", weight: 0.14, is_active: true },
    { route_code: "BLR-HYD", origin: "Bengaluru (BLR)", destination: "Hyderabad (HYD)", distance_km: 500, category: "METRO_METRO", weight: 0.13, is_active: true },
    { route_code: "MAA-DEL", origin: "Chennai (MAA)", destination: "Delhi (DEL)", distance_km: 1760, category: "METRO_METRO", weight: 0.10, is_active: true },
  ]);

  const [dataSources, setDataSources] = useState<DataSourceItem[]>([
    {
      id: "src-mmt",
      source_name: "OTA_MAKEMYTRIP",
      source_type: "OTA_API",
      base_url: "https://api.makemytrip.com/flights/v2",
      rate_limit_per_minute: 120,
      status: "ACTIVE",
      compliance_notes: "Real-time OTA aggregator feed for domestic coach quotes"
    },
    {
      id: "src-easemytrip",
      source_name: "OTA_EASEMYTRIP",
      source_type: "OTA_API",
      base_url: "https://partner.easemytrip.com/search",
      rate_limit_per_minute: 90,
      status: "ACTIVE",
      compliance_notes: "OTA aggregator tariff feed with zero convenience fee tracking"
    },
    {
      id: "src-yatra",
      source_name: "OTA_YATRA",
      source_type: "OTA_API",
      base_url: "https://flight.yatra.com/api/v1",
      rate_limit_per_minute: 60,
      status: "ACTIVE",
      compliance_notes: "Monitored OTA domestic carrier quote stream"
    },
    {
      id: "src-cleartrip",
      source_name: "OTA_CLEARTRIP",
      source_type: "OTA_API",
      base_url: "https://api.cleartrip.com/air/v3",
      rate_limit_per_minute: 80,
      status: "ACTIVE",
      compliance_notes: "OTA aggregator multi-airline fare inventory feed"
    },
    {
      id: "src-indigo",
      source_name: "AIRLINE_INDIGO_DIRECT",
      source_type: "DIRECT_API",
      base_url: "https://www.goindigo.in/api/booking",
      rate_limit_per_minute: 150,
      status: "ACTIVE",
      compliance_notes: "Carrier direct API tariff integration (6E)"
    },
    {
      id: "src-airindia",
      source_name: "AIRLINE_AIRINDIA_DIRECT",
      source_type: "DIRECT_API",
      base_url: "https://api.airindia.com/v1/fares",
      rate_limit_per_minute: 100,
      status: "ACTIVE",
      compliance_notes: "Carrier direct API tariff integration (AI)"
    },
    {
      id: "src-dgca",
      source_name: "DGCA_OFFICIAL_PORTAL",
      source_type: "OFFICIAL_GOVT",
      base_url: "https://www.dgca.gov.in",
      rate_limit_per_minute: 10,
      status: "ACTIVE",
      compliance_notes: "Official Directorate General of Civil Aviation government tariff & traffic data portal"
    },
    {
      id: "src-demo",
      source_name: "DEMO_SYNTHETIC_FEED",
      source_type: "DEMO",
      base_url: "internal://demo-adapter",
      rate_limit_per_minute: 60,
      status: "ACTIVE",
      compliance_notes: "Synthetic development feed with fixed statistical seed. Isolated from official data."
    }
  ]);

  // Load from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, rolesRes, sourcesRes] = await Promise.all([
          api.getAdminUsers(),
          api.getRoles(),
          api.getDataSources()
        ]);
        if (usersRes && usersRes.length > 0) setUsers(usersRes);
        if (rolesRes && rolesRes.length > 0) setRoles(rolesRes);
        if (sourcesRes && sourcesRes.length > 0) setDataSources(sourcesRes);
      } catch (err) {
        console.warn("Could not fetch remote config data:", err);
      }
    }
    loadData();
  }, []);

  const handleToggleUser = async (userId: string) => {
    try {
      await api.toggleUserStatus(userId);
    } catch (e) {
      // fallback local update
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    );
    if (onNotify) onNotify("User status updated.");
  };

  const handleToggleSource = async (sourceId: string) => {
    try {
      await api.toggleDataSource(sourceId);
    } catch (e) {
      // fallback local update
    }
    setDataSources((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? { ...s, status: s.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
          : s
      )
    );
    if (onNotify) onNotify("Data Source status updated.");
  };

  const handleToggleRoute = (routeCode: string) => {
    setRoutes((prev) =>
      prev.map((r) =>
        r.route_code === routeCode ? { ...r, is_active: !r.is_active } : r
      )
    );
    if (onNotify) onNotify(`Route ${routeCode} active status toggled.`);
  };

  return (
    <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-sm p-6 shadow-xs font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#1e40af] text-white text-[10px] font-mono font-bold rounded-xs tracking-wider">
              MASTER ACCESS CONFIGURATION
            </span>
            <span className="text-xs font-mono text-[#6b7280]">
              Admin Flow &middot; Master Governance Station
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#111111] uppercase tracking-tight">
            Admin Configuration: Users, Roles, Routes & Data Sources
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Institutional master controls governing user authentication, role-based access, monitored route topology, and OTA aggregator data ingestion feeds.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-[#fafafa] border border-[#e5e7eb] rounded-sm font-mono text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold transition-colors ${
              activeTab === "USERS"
                ? "bg-[#111111] text-white shadow-xs"
                : "text-[#6b7280] hover:text-[#111111]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>

          <button
            onClick={() => setActiveTab("ROLES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold transition-colors ${
              activeTab === "ROLES"
                ? "bg-[#111111] text-white shadow-xs"
                : "text-[#6b7280] hover:text-[#111111]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles</span>
          </button>

          <button
            onClick={() => setActiveTab("ROUTES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold transition-colors ${
              activeTab === "ROUTES"
                ? "bg-[#111111] text-white shadow-xs"
                : "text-[#6b7280] hover:text-[#111111]"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Routes</span>
          </button>

          <button
            onClick={() => setActiveTab("DATA_SOURCES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold transition-colors ${
              activeTab === "DATA_SOURCES"
                ? "bg-[#111111] text-white shadow-xs"
                : "text-[#6b7280] hover:text-[#111111]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>All Data Sources</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === "USERS" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">
              Displaying {users.length} authenticated personnel across civil aviation oversight.
            </span>
            <button
              onClick={() => onNotify && onNotify("Add User modal ready.")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#111111] text-white rounded-xs hover:bg-[#27272a] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#e5e7eb] rounded-sm">
            <table className="w-full text-left">
              <thead className="bg-[#fafafa] border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Personnel</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#111111] font-sans">
                      {u.full_name}
                    </td>
                    <td className="py-3 px-3 text-[#4b5563]">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 bg-[#f3f4f6] text-[#111111] border border-[#e5e7eb] text-[10px] rounded-xs font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.is_active ? (
                        <span className="text-[#15803d] flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[#b91c1c] flex items-center gap-1 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          SUSPENDED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#6b7280]">
                      {u.last_login ? new Date(u.last_login).toLocaleString("en-IN") : "Never"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xs border transition-colors ${
                          u.is_active
                            ? "bg-[#fff1f2] border-[#fecdd3] text-[#b91c1c] hover:bg-[#ffe4e6]"
                            : "bg-[#ecfdf5] border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5]"
                        }`}
                      >
                        {u.is_active ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & RBAC MATRIX */}
      {activeTab === "ROLES" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="text-xs text-[#6b7280]">
            Role-Based Access Control (RBAC) governance matrix specifying programmatic and workstation entitlements.
          </div>

          <div className="overflow-x-auto border border-[#e5e7eb] rounded-sm">
            <table className="w-full text-left">
              <thead className="bg-[#fafafa] border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Role Descriptor</th>
                  <th className="py-2.5 px-3 text-center">Manage Users</th>
                  <th className="py-2.5 px-3 text-center">Configure Routes</th>
                  <th className="py-2.5 px-3 text-center">Trigger Pipeline</th>
                  <th className="py-2.5 px-3 text-center">DGCA Calibration</th>
                  <th className="py-2.5 px-3 text-center">Export Raw Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {roles.map((r) => (
                  <tr key={r.role_key} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#111111]">{r.role_name}</div>
                      <div className="text-[10px] text-[#6b7280] font-sans mt-0.5">{r.description}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.can_manage_users ? (
                        <CheckCircle2 className="w-4 h-4 text-[#15803d] mx-auto" />
                      ) : (
                        <span className="text-[#d1d5db] font-bold">&ndash;</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.can_configure_routes ? (
                        <CheckCircle2 className="w-4 h-4 text-[#15803d] mx-auto" />
                      ) : (
                        <span className="text-[#d1d5db] font-bold">&ndash;</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.can_trigger_pipeline ? (
                        <CheckCircle2 className="w-4 h-4 text-[#15803d] mx-auto" />
                      ) : (
                        <span className="text-[#d1d5db] font-bold">&ndash;</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.can_calibrate_dgca ? (
                        <CheckCircle2 className="w-4 h-4 text-[#15803d] mx-auto" />
                      ) : (
                        <span className="text-[#d1d5db] font-bold">&ndash;</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.can_export_raw_data ? (
                        <CheckCircle2 className="w-4 h-4 text-[#15803d] mx-auto" />
                      ) : (
                        <span className="text-[#d1d5db] font-bold">&ndash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AIR ROUTES TOPOLOGY */}
      {activeTab === "ROUTES" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">
              Monitored Trunk & Regional Corridors in the Laspeyres Representative Basket.
            </span>
            <button
              onClick={() => onNotify && onNotify("Add Route modal ready.")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#111111] text-white rounded-xs hover:bg-[#27272a] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Corridor</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#e5e7eb] rounded-sm">
            <table className="w-full text-left">
              <thead className="bg-[#fafafa] border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Route Code</th>
                  <th className="py-2.5 px-3">City Pair</th>
                  <th className="py-2.5 px-3">Distance</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Basket Weight</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {routes.map((r) => (
                  <tr key={r.route_code} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#111111]">
                      {r.route_code}
                    </td>
                    <td className="py-3 px-3 text-[#4b5563]">
                      {r.origin} &rarr; {r.destination}
                    </td>
                    <td className="py-3 px-3 text-[#6b7280]">
                      {r.distance_km} km
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb] text-[10px] rounded-xs font-bold">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#111111]">
                      {(r.weight * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3">
                      {r.is_active ? (
                        <span className="text-[#15803d] font-bold">ACTIVE IN BASKET</span>
                      ) : (
                        <span className="text-[#6b7280] font-bold">EXCLUDED</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleRoute(r.route_code)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xs border transition-colors ${
                          r.is_active
                            ? "bg-[#fff1f2] border-[#fecdd3] text-[#b91c1c] hover:bg-[#ffe4e6]"
                            : "bg-[#ecfdf5] border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5]"
                        }`}
                      >
                        {r.is_active ? "Pause" : "Include"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL DATA SOURCES & OTA AGGREGATORS */}
      {activeTab === "DATA_SOURCES" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">
              Monitored OTA Aggregators, Direct Airline APIs, and Official Government feeds.
            </span>
            <button
              onClick={() => onNotify && onNotify("Add Data Source modal ready.")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#111111] text-white rounded-xs hover:bg-[#27272a] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Feed</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#e5e7eb] rounded-sm">
            <table className="w-full text-left">
              <thead className="bg-[#fafafa] border-b border-[#e5e7eb] text-[10px] text-[#6b7280] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Data Source Name</th>
                  <th className="py-2.5 px-3">Source Type</th>
                  <th className="py-2.5 px-3">Endpoint / URL</th>
                  <th className="py-2.5 px-3">Rate Limit</th>
                  <th className="py-2.5 px-3">Ingestion Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {dataSources.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#111111]">{s.source_name}</div>
                      <div className="text-[10px] text-[#6b7280] font-sans truncate max-w-xs">{s.compliance_notes}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-xs border ${
                        s.source_type === "OTA_API"
                          ? "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]"
                          : s.source_type === "DIRECT_API"
                          ? "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]"
                          : s.source_type === "OFFICIAL_GOVT"
                          ? "bg-[#fdf4ff] text-[#86198f] border-[#f5d0fe]"
                          : "bg-[#f4f4f5] text-[#3f3f46] border-[#e4e4e7]"
                      }`}>
                        {s.source_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#4b5563] truncate max-w-xs font-mono text-[11px]">
                      {s.base_url || "internal"}
                    </td>
                    <td className="py-3 px-3 text-[#111111]">
                      {s.rate_limit_per_minute} req/min
                    </td>
                    <td className="py-3 px-3">
                      {s.status === "ACTIVE" ? (
                        <span className="text-[#15803d] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>
                          STREAMING
                        </span>
                      ) : (
                        <span className="text-[#6b7280] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]"></span>
                          PAUSED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleSource(s.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xs border transition-colors ${
                          s.status === "ACTIVE"
                            ? "bg-[#fff1f2] border-[#fecdd3] text-[#b91c1c] hover:bg-[#ffe4e6]"
                            : "bg-[#ecfdf5] border-[#a7f3d0] text-[#059669] hover:bg-[#d1fae5]"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "Pause Feed" : "Resume"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
