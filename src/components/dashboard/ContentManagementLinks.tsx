import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  FileText,
  Video,
  Mic2,
  BookOpen,
  Mail,
  ShoppingCart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryLinks = [
  { href: "/dashboard/posts", label: "Blog Posts", icon: FileText },
  { href: "/dashboard/products", label: "Products", icon: ShoppingCart },
  { href: "/dashboard/subscribers", label: "Newsletter", icon: Mail },
];

const secondaryLinks = [
  { href: "/dashboard/videos", label: "Videos", icon: Video },
  { href: "/dashboard/vip", label: "VIP Content", icon: BookOpen },
  { href: "/dashboard/podcasts", label: "Podcasts", icon: Mic2 },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/lyrics", label: "Lyrics", icon: FileText },
];

export default function ContentManagementCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage your digital content</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {primaryLinks.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            className="w-full justify-start gap-3"
            asChild
          >
            <a href={link.href}>
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          </Button>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <ChevronDown className="w-4 h-4" />
              More Content Types
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {secondaryLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <a href={link.href} className="flex items-center gap-2">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
