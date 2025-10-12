import React, { useState, useEffect } from "react";
import { WordPressPublishLog } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Search, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function WordPressPublishLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await WordPressPublishLog.list("-created_date", 100);
      setLogs(fetchedLogs || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load publish logs");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.post_title?.toLowerCase().includes(term) ||
      log.credential_name?.toLowerCase().includes(term) ||
      log.site_domain?.toLowerCase().includes(term) ||
      log.error_message?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">WordPress Publish Logs</h1>
          <p className="text-slate-600 mt-1">
            View detailed logs of all WordPress publishing attempts
          </p>
        </div>
        <Button onClick={loadLogs} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by title, site, credential, or error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Publish History ({filteredLogs.length} {filteredLogs.length === 1 ? 'attempt' : 'attempts'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {searchTerm ? "No logs match your search" : "No publish attempts yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Post Title</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.status === 'success' ? (
                          <Badge className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {moment(log.created_date).format('MMM D, YYYY h:mm A')}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {log.post_title}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {log.site_domain}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {log.credential_name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(log)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish Attempt Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <div className="mt-1">
                    {selectedLog.status === 'success' ? (
                      <Badge className="bg-green-100 text-green-800 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Timestamp</p>
                  <p className="mt-1 text-sm">{moment(selectedLog.created_date).format('MMMM D, YYYY h:mm:ss A')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Duration</p>
                  <p className="mt-1 text-sm">{selectedLog.duration_ms}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">User</p>
                  <p className="mt-1 text-sm">{selectedLog.user_email || 'Unknown'}</p>
                </div>
              </div>

              {/* Post Info */}
              <div>
                <h3 className="font-semibold mb-2">Post Information</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Title: </span>
                    <span className="text-sm">{selectedLog.post_title}</span>
                  </div>
                  {selectedLog.post_slug && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">Slug: </span>
                      <span className="text-sm">{selectedLog.post_slug}</span>
                    </div>
                  )}
                  {selectedLog.wordpress_post_url && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">WordPress URL: </span>
                      <a
                        href={selectedLog.wordpress_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedLog.wordpress_post_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedLog.wordpress_post_id && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">WordPress Post ID: </span>
                      <span className="text-sm">{selectedLog.wordpress_post_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Info */}
              <div>
                <h3 className="font-semibold mb-2">Connection Information</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Site Domain: </span>
                    <span className="text-sm">{selectedLog.site_domain}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Credential: </span>
                    <span className="text-sm">{selectedLog.credential_name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Endpoint: </span>
                    <span className="text-sm font-mono text-xs break-all">{selectedLog.request_endpoint}</span>
                  </div>
                </div>
              </div>

              {/* Error Details (if any) */}
              {selectedLog.status === 'error' && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Error Details</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                    {selectedLog.error_code && (
                      <div>
                        <span className="text-sm font-medium text-red-700">Error Code: </span>
                        <span className="text-sm text-red-900 font-mono">{selectedLog.error_code}</span>
                      </div>
                    )}
                    {selectedLog.error_message && (
                      <div>
                        <span className="text-sm font-medium text-red-700">Error Message: </span>
                        <span className="text-sm text-red-900">{selectedLog.error_message}</span>
                      </div>
                    )}
                    {selectedLog.response_status && (
                      <div>
                        <span className="text-sm font-medium text-red-700">HTTP Status: </span>
                        <span className="text-sm text-red-900">{selectedLog.response_status}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request Payload */}
              {selectedLog.request_payload && (
                <div>
                  <h3 className="font-semibold mb-2">Request Payload</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.response_body && (
                <div>
                  <h3 className="font-semibold mb-2">Response Body</h3>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.response_body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}