import React, { useEffect, useState } from "react";
import Container from "../components/layout/Container";
import {
  BedDouble,
  CreditCard,
  ClipboardList,
  PlusCircle,
  Receipt,
  DoorOpen,
  Soup,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const NAVY = "#0A1A2F";
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    todaysCheckins: 0,
    todaysCheckouts: 0,
    activeBookings: 0,
    todaysRevenue: 0,
    recentCheckins: [],
    bookingTrend: [],
    revenueByCategory: [],
    topMenuItems: [],
    kitchenStatus: [],
  });

  const COLORS = ["#0A1A2F", "#1C3A5D", "#3A5D7D", "#5D7F9D"];

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/summary`)
      .then((res) => res.json())
      .then((data) => {
        let kitchenStatusArray = [];
        if (data.kitchenStatus) {
          kitchenStatusArray = Array.isArray(data.kitchenStatus)
            ? data.kitchenStatus
            : Object.entries(data.kitchenStatus).map(([status, count]) => ({ status, count }));
        }
        setStats((prev) => ({
          ...prev,
          ...data,
          kitchenStatus: kitchenStatusArray,
        }));
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/api/dashboard/bookings-trend?days=30`)
      .then((res) => res.json())
      .then((data) => setStats((prev) => ({ ...prev, bookingTrend: data || [] })))
      .catch(console.error);

    fetch(`${API_BASE_URL}/api/dashboard/revenue-by-category`)
      .then((res) => res.json())
      .then((data) => setStats((prev) => ({ ...prev, revenueByCategory: data || [] })))
      .catch(console.error);

    fetch(`${API_BASE_URL}/api/dashboard/top-menu-items`)
      .then((res) => res.json())
      .then((data) => setStats((prev) => ({ ...prev, topMenuItems: data || [] })))
      .catch(console.error);

    fetch(`${API_BASE_URL}/api/dashboard/kitchen-status`)
      .then((res) => res.json())
      .then((data) => setStats((prev) => ({ ...prev, kitchenStatus: data || [] })))
      .catch(console.error);
  }, []);

  const topCards = [
    {
      label: "Today's Occupancy",
      value: stats.totalRooms
        ? `${Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%`
        : "0%",
      icon: BedDouble,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      label: "Active Bookings",
      value: stats.activeBookings,
      icon: ClipboardList,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
    },
    {
      label: "Pending Checkouts",
      value: stats.todaysCheckouts,
      icon: CreditCard,
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-50 to-amber-100",
    },
  ];

  const quickActions = [
    { label: "New Booking", icon: PlusCircle, link: "/booking", gradient: "from-emerald-500 to-green-600" },
    { label: "Create Bill", icon: Receipt, link: "/billing", gradient: "from-blue-500 to-indigo-600" },
  ];

  return (
    <Container title="Dashboard" subtitle="Hotel Overview">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
        {topCards.map((card, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200"
          >
            {/* Background gradient decoration */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${card.bgGradient} opacity-20 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>

            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  {card.label}
                </span>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Value */}
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {card.value}
                </span>
              </div>

              {/* Animated bottom border */}
              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${card.gradient} transition-all duration-500`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Check-ins & Quick Actions */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <DoorOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Recent Check-ins
                </h3>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentCheckins.length > 0 ? (
                stats.recentCheckins.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 border border-gray-100 transition-all duration-300 hover:shadow-md"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                      {item.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Room {item.room} • {item.date}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">🏨</div>
                  <p className="text-gray-400 font-medium">No recent check-ins</p>
                  <p className="text-xs text-gray-300 mt-1">Check-ins will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Quick Actions
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2  gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.link)}
                  className="group relative overflow-hidden rounded-2xl  p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient}`}></div>

                  {/* Hover shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white text-center">
                      {action.label}
                    </span>
                  </div>

                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-gradient-to-br ${action.gradient} transition-opacity duration-300 -z-10`}></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts section can go here */}
      {/* ... (LineChart, BarChart, PieChart) */}
    </Container>
  );
}