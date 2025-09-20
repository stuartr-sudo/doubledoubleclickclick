import React, { useState, useEffect } from "react";
import { WaitlistEntry } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function WaitlistManager() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserAndLoad = async () => {
      try {
        const user = await User.me();
        if (user.role === 'admin') {
          setIsAdmin(true);
          const waitlistEntries = await WaitlistEntry.list('-created_date');
          setEntries(waitlistEntries);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error loading waitlist entries:", error);
      }
      setIsLoading(false);
    };

    checkUserAndLoad();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
       <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Waitlist Submissions</h1>
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              {entries.length} Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800">
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white text-right">Date Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className="border-slate-800 hover:bg-slate-700/50">
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(entry.created_date), 'PPP p')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {entries.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <p>No one has joined the waitlist yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}