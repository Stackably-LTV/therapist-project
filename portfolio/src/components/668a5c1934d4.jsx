"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from "recharts";
import { Calendar, Users, Eye, TrendingUp, Activity } from "lucide-react";
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
const truncatePath = (path, limit = 36) => path.length > limit ? `${path.slice(0, limit - 1)}…` : path;
const getYAxisDomain = (data) => {
    const maxVal = data.length
        ? Math.max(...data.map((day) => day.visitors))
        : 10;
    const paddedMax = Math.ceil((maxVal || 1) * 1.15);
    return [0, paddedMax];
};
export default function AnalyticsDashboard() {
    const [data, setData] = useState({
        totalVisitors: 0,
        totalPageViews: 0,
        avgSessionDuration: "0:00",
        topPages: [],
        dailyVisits: [],
        deviceBreakdown: [],
    });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("7d");
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/analytics?range=${timeRange}`);
                if (response.ok) {
                    const analyticsData = await response.json();
                    setData(analyticsData);
                }
            }
            catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [timeRange]);
    if (loading) {
        return (<div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>);
    }
    return (<div className="analytics-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="analytics-dashboard__title text-3xl font-bold mb-4">
          Analytics Dashboard
        </h1>
      </div>

      {/* Time Range Selector */}
      <div className="analytics-dashboard__range-toggle">
        {["7d", "30d", "90d"].map((range) => {
            const isActive = timeRange === range;
            return (<button type="button" key={range} onClick={() => setTimeRange(range)} className={`analytics-dashboard__range-button${isActive ? " analytics-dashboard__range-button--active" : ""}`} aria-pressed={isActive}>
              {range === "7d"
                    ? "Last 7 Days"
                    : range === "30d"
                        ? "Last 30 Days"
                        : "Last 90 Days"}
            </button>);
        })}
      </div>

      {/* Stats Cards */}
      <div className="analytics-dashboard__stat-grid">
        <StatCard title="Total Visitors" value={data.totalVisitors.toLocaleString()} icon={<Users className="w-6 h-6"/>} color="emerald" trend="+12.5%"/>
        <StatCard title="Page Views" value={data.totalPageViews.toLocaleString()} icon={<Eye className="w-6 h-6"/>} color="blue" trend="+8.3%"/>
        <StatCard title="Avg. Session" value={data.avgSessionDuration} icon={<Activity className="w-6 h-6"/>} color="purple" trend="+5.2%"/>
        <StatCard title="Bounce Rate" value="42.3%" icon={<TrendingUp className="w-6 h-6"/>} color="orange" trend="-3.1%"/>
      </div>

      {/* Charts Grid */}
      <div className="analytics-dashboard__main-grid">
        {/* Daily Visits Chart */}
        <div className="analytics-dashboard__card">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600"/>
            Daily Visitors & Page Views
          </h3>
          <div className="analytics-dashboard__chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyVisits} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12}/>
                <YAxis stroke="#64748b" fontSize={12} domain={getYAxisDomain(data.dailyVisits)}/>
                <Tooltip contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
        }}/>
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} name="Visitors"/>
                <Line type="monotone" dataKey="pageviews" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} name="Page Views"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Pages Chart */}
        <div className="analytics-dashboard__card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-900">Top Pages</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Page Views
            </span>
          </div>
          <div className="analytics-dashboard__chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topPages} layout="vertical" barCategoryGap={12} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="topPagesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981"/>
                    <stop offset="100%" stopColor="#3b82f6"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis type="number" stroke="#cbd5f5" fontSize={12}/>
                <YAxis type="category" dataKey="path" stroke="#94a3b8" fontSize={12} width={220} tickFormatter={(value) => truncatePath(value)} tick={{ fill: "#475569" }} interval={0}/>
                <Tooltip contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
        }}/>
                <Bar dataKey="views" fill="#10b981" radius={[0, 8, 8, 0]} barSize={24}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 text-right mt-3">
            Labels truncated · full path shown in tooltip
          </p>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="analytics-dashboard__card">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Device Breakdown
        </h3>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/2">
            <div className="analytics-dashboard__chart analytics-dashboard__chart--pie">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.deviceBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {data.deviceBreakdown.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full lg:w-1/2 space-y-3">
            {data.deviceBreakdown.map((device, index) => (<div key={device.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                  <span className="text-slate-700 font-medium">
                    {device.name}
                  </span>
                </div>
                <span className="text-slate-900 font-bold">
                  {device.value.toLocaleString()}
                </span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
function StatCard({ title, value, icon, color, trend }) {
    const colorClasses = {
        emerald: "bg-emerald-100 text-emerald-600",
        blue: "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
        orange: "bg-orange-100 text-orange-600",
    };
    return (<div className="analytics-dashboard__stat-card">
      <div className="analytics-dashboard__stat-card-header">
        <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-inner`}>
          {icon}
        </div>
        {trend ? (<span className={`text-sm font-semibold leading-6 ${trend.startsWith("+") ? "trend-positive" : "trend-negative"}`}>
            {trend}
          </span>) : null}
      </div>
      <div className="analytics-dashboard__stat-card-body">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </div>);
}
