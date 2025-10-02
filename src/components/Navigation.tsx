import { Link } from "react-router-dom";
import { Database } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Database className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">DataFlow</span>
        </Link>
      </div>
    </nav>
  );
};
