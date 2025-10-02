import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, ExternalLink } from "lucide-react";

const ShareMock = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Minimal Header */}
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">DataFlow</span>
          </div>
        </div>
      </nav>

      <main className="container max-w-4xl px-4 py-12">
        {/* Share Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Shared Data View</h1>
          <p className="text-muted-foreground">
            View-only access to: <span className="font-medium">{slug}</span>
          </p>
        </div>

        {/* Shared Content */}
        <Card className="shadow-elegant mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dataset Overview</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sample Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-secondary/50">
                        <td className="px-4 py-3 text-sm">{i}</td>
                        <td className="px-4 py-3 text-sm">Item {i}</td>
                        <td className="px-4 py-3 text-sm">${(Math.random() * 1000).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">Columns</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">24h</p>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          This is a read-only shared view. Contact the owner for full access.
        </p>
      </main>
    </div>
  );
};

export default ShareMock;
