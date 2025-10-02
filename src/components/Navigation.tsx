import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Plus } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Database className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">DataFlow</span>
        </Link>

        {/* Ingest Button */}
        <Link to="/ingest">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ingest
          </Button>
        </Link>
      </div>
    </nav>
  );
};
