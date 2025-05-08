import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Settings } from "lucide-react";
import ContentManagementCard from "./ContentManagementLinks";

export default function QuickActions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Control Panel</h1>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Content Management Card */}
        <ContentManagementCard />

        {/* Analytics Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Track your performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-between" asChild>
              <a href="/dashboard/analytics">
                View Analytics
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <a href="/dashboard/reports">
                Generate Reports
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-between" asChild>
              <a href="/profile">
                Profile Settings
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <a href="/dashboard/integrations">
                Integrations
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
