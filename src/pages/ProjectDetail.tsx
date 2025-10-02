import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { BarChart3, FileText, Settings, Share2 } from "lucide-react";

const ProjectDetail = () => {
  const { id } = useParams();
  const { projects } = useProjectStore();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="container px-4 py-12">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12,548</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2,340 this month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">
                3 active connections
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2h</div>
              <p className="text-xs text-muted-foreground mt-1">
                ago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Overview
              </CardTitle>
              <CardDescription>
                Key metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Chart visualization</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest data processing jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Data ingestion #{i}</p>
                      <p className="text-xs text-muted-foreground">
                        {i} hour{i > 1 ? 's' : ''} ago
                      </p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Success</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
