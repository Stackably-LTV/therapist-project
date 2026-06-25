"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from "recharts";
import { TrendingUp, Users, Eye, Activity } from "lucide-react";
export default function AnalyticsCollectionView() {
    const [data, setData] = useState({
        totalVisitors: 0,
        totalPageViews: 0,
        dailyVisits: [],
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchQuickStats();
    }, []);
    const fetchQuickStats = async () => {
        try {
            const response = await fetch("/api/analytics?range=7d");
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
    if (loading) {
        return (<div className="analytics-loading analytics-collection-view">
        <div className="spinner"></div>
      </div>);
    }
    return (<div className="analytics-collection-view" style={{
            padding: "1.5rem",
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: "#ffffff",
            margin: "0 0 0.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
        }}>
          <Activity className="w-6 h-6"/>
          Analytics Overview
        </h2>
        <p style={{
            fontSize: "0.875rem",
            color: "rgba(255, 255, 255, 0.9)",
            margin: 0,
        }}>
          Last 7 days of visitor activity
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
        }}>
        <StatCard title="Total Visitors" value={data.totalVisitors.toLocaleString()} icon={<Users className="w-5 h-5"/>} color="blue"/>
        <StatCard title="Page Views" value={data.totalPageViews.toLocaleString()} icon={<Eye className="w-5 h-5"/>} color="green"/>
        <StatCard title="Avg. Daily" value={Math.round(data.totalVisitors / 7).toLocaleString()} icon={<Activity className="w-5 h-5"/>} color="purple"/>
      </div>

      {/* Chart */}
      <div className="analytics-chart-container" style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.75rem",
        }}>
          <h3 style={{
            fontSize: "0.95rem",
            fontWeight: "600",
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: 0,
        }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#3b82f6" }}/>
            Visitor Trend
          </h3>
          <Link href="/admin/analytics" style={{
            fontSize: "0.8125rem",
            color: "#3b82f6",
            fontWeight: "500",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
        }}>
            View Full Dashboard →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.dailyVisits} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.8}/>
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tick={{ fill: "#6b7280" }} tickMargin={8}/>
            <YAxis stroke="#9ca3af" fontSize={11} tick={{ fill: "#6b7280" }} tickMargin={8}/>
            <Tooltip contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "8px 12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }} labelStyle={{
            fontWeight: "600",
            color: "#111827",
            marginBottom: "4px",
        }}/>
            <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6, strokeWidth: 2 }} name="Visitors"/>
            <Line type="monotone" dataKey="pageviews" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6, strokeWidth: 2 }} name="Page Views"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>);
}
function StatCard({ title, value, icon, color }) {
    const colorStyles = {
        blue: { bg: "#dbeafe", color: "#1e40af", iconBg: "#3b82f6" },
        green: { bg: "#d1fae5", color: "#065f46", iconBg: "#10b981" },
        purple: { bg: "#e9d5ff", color: "#6b21a8", iconBg: "#a855f7" },
    };
    const style = colorStyles[color];
    return (<div className="analytics-stat-card" style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            transition: "all 0.2s ease",
            cursor: "default",
        }}>
      <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
        }}>
        <div style={{
            background: style.iconBg,
            padding: "0.625rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: "0.75rem",
            color: "#6b7280",
            fontWeight: "500",
            margin: "0 0 0.25rem 0",
            textTransform: "uppercase",
            letterSpacing: "0.025em",
        }}>
            {title}
          </p>
          <p style={{
            fontSize: "1.875rem",
            fontWeight: "700",
            color: "#111827",
            margin: 0,
            lineHeight: 1,
        }}>
            {value}
          </p>
        </div>
      </div>
    </div>);
}
