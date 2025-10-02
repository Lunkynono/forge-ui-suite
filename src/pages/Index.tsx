import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { ArrowRight, Database, FileText, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const { projects } = useProjectStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Transform Your Data Into Insights
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect, process, and analyze data from any source with our powerful platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/ingest">
              <Button size="lg" className="gap-2 shadow-elegant">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multiple Sources</CardTitle>
              <CardDescription>
                Connect databases, APIs, files, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Processing</CardTitle>
              <CardDescription>
                Lightning-fast data ingestion and transformation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Powerful insights with built-in visualization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Easy Sharing</CardTitle>
              <CardDescription>
                Collaborate with secure, shareable views
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <Link to="/ingest">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Updated {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
