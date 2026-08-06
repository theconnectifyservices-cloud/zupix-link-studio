import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminKPIs } from "@/features/admin/hooks/use-admin-center";
import { Users, FileText, IndianRupee, Zap, Activity, Globe, ShoppingBag, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: kpis, isLoading } = useAdminKPIs();

  const stats = [
    { title: "Total Users", value: kpis?.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Bio Pages", value: kpis?.totalPages, icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Revenue", value: `₹${kpis?.totalRevenue?.toLocaleString()}`, icon: IndianRupee, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Active Today", value: kpis?.activeToday, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Custom Domains", value: "124", icon: Globe, color: "text-sky-500", bg: "bg-sky-500/10" },
    { title: "Mini Stores", value: "45", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-500/10" },
    { title: "Bookings", value: "89", icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Storage Used", value: "4.2 GB", icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time performance metrics and platform health.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative group">
              <div className={`absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20`}>
                <stat.icon className="h-24 w-24 -mr-8 -mt-8" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <div className="h-8 w-24 bg-muted animate-pulse rounded" /> : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500 font-medium">↑ 12%</span> vs last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed">
            <p className="text-muted-foreground italic">Chart Component Integration Pending...</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                     <Activity className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div className="flex-1">
                     <p className="text-sm font-medium">New User Registration</p>
                     <p className="text-xs text-muted-foreground">2 mins ago</p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
