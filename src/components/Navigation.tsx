import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Plus } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";

export const Navigation = () => {
  const location = useLocation();
  const { currentProject, setCurrentProject, projects } = useProjectStore();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Database className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">DataFlow</span>
        </Link>

        {/* Center - Project Selector */}
        <div className="flex items-center gap-4">
          <Select value={currentProject} onValueChange={setCurrentProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right - Ingest Button */}
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
