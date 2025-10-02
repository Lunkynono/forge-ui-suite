import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Database, FileText } from "lucide-react";

const Ingest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="container max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ingest Data</h1>
          <p className="text-muted-foreground">Upload and process your data sources</p>
        </div>

        <div className="grid gap-6">
          {/* File Upload Card */}
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Support for CSV, JSON, Excel, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="secondary" className="mt-2">
                  Select Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Database Connection Card */}
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Connect Database
              </CardTitle>
              <CardDescription>
                Import data directly from your database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connection-string">Connection String</Label>
                <Input 
                  id="connection-string" 
                  placeholder="postgresql://user:pass@host:5432/db"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="query">SQL Query (Optional)</Label>
                <Textarea 
                  id="query" 
                  placeholder="SELECT * FROM table_name"
                  rows={4}
                />
              </div>
              <Button className="w-full">Connect & Import</Button>
            </CardContent>
          </Card>

          {/* API Integration Card */}
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                API Integration
              </CardTitle>
              <CardDescription>
                Pull data from REST APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Endpoint</Label>
                <Input 
                  id="api-url" 
                  placeholder="https://api.example.com/data"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key (Optional)</Label>
                  <Input id="api-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Input id="method" value="GET" readOnly />
                </div>
              </div>
              <Button className="w-full">Fetch Data</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Ingest;
