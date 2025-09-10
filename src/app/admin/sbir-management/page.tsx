'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Upload, 
  Database, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface SBIRRecord {
  id: number;
  topic_number: string;
  topic_id: string;
  title: string;
  component: string;
  status: string;
  days_until_close: string;
  created_date: string;
  [key: string]: any;
}

interface DatabaseStats {
  totalRecords: number;
  recentRecords: number;
  components: Array<{ component: string; count: number }>;
  statuses: Array<{ status: string; count: number }>;
  lastUpdated: string;
}

export default function SBIRManagementPage() {
  const [records, setRecords] = useState<SBIRRecord[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraperStatus, setScraperStatus] = useState<'idle' | 'running'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch database statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/sbir/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch SBIR records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        search: searchTerm,
        component: selectedComponent,
        status: selectedStatus,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/sbir?${params}`);
      const data = await response.json();
      
      setRecords(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check scraper status
  const checkScraperStatus = async () => {
    try {
      const response = await fetch('/api/admin/sbir/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_status' })
      });
      const data = await response.json();
      setScraperStatus(data.status);
    } catch (error) {
      console.error('Error checking scraper status:', error);
    }
  };

  // Start scraper
  const startScraper = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sbir/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_scraper' })
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Scraper completed successfully! Processed ${data.processed} records.`);
        fetchStats();
        fetchRecords();
      } else {
        alert('Error starting scraper: ' + data.error);
      }
    } catch (error) {
      console.error('Error starting scraper:', error);
      alert('Error starting scraper');
    } finally {
      setLoading(false);
    }
  };

  // Update record
  const updateRecord = async (id: number, updates: Partial<SBIRRecord>) => {
    try {
      const response = await fetch('/api/admin/sbir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      
      if (response.ok) {
        fetchRecords();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating record:', error);
      return false;
    }
  };

  // Delete record
  const deleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await fetch(`/api/admin/sbir?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchRecords();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchRecords();
    checkScraperStatus();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchTerm, selectedComponent, selectedStatus, sortBy, sortOrder]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SBIR Database Management</h1>
        <div className="flex items-center space-x-2">
          <Badge variant={scraperStatus === 'running' ? 'default' : 'secondary'}>
            {scraperStatus === 'running' ? (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Running
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Idle
              </>
            )}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="scraper">Automated Scraper</TabsTrigger>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRecords?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  All SBIR/STTR topics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentRecords?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Component</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.components?.[0]?.component || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.components?.[0]?.count?.toLocaleString() || '0'} topics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Database refresh
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.components?.slice(0, 5).map((comp, index) => (
                    <div key={comp.component} className="flex justify-between items-center">
                      <span className="text-sm">{comp.component}</span>
                      <Badge variant="secondary">{comp.count.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.statuses?.slice(0, 5).map((status, index) => (
                    <div key={status.status} className="flex justify-between items-center">
                      <span className="text-sm">{status.status}</span>
                      <Badge variant="outline">{status.count.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <select
                      value={selectedComponent}
                      onChange={(e) => setSelectedComponent(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="">All Components</option>
                      {stats?.components?.map(comp => (
                        <option key={comp.component} value={comp.component}>
                          {comp.component}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="">All Statuses</option>
                      {stats?.statuses?.map(status => (
                        <option key={status.status} value={status.status}>
                          {status.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={fetchRecords} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Topic Number</th>
                        <th className="text-left p-2">Title</th>
                        <th className="text-left p-2">Component</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Days Until Close</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-sm">{record.topic_number}</td>
                          <td className="p-2 max-w-xs truncate">{record.title}</td>
                          <td className="p-2">{record.component}</td>
                          <td className="p-2">
                            <Badge variant={record.status === 'Open' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="p-2">{record.days_until_close || 'N/A'}</td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newStatus = record.status === 'Open' ? 'Closed' : 'Open';
                                  updateRecord(record.id, { status: newStatus });
                                }}
                              >
                                Toggle
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRecord(record.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scraper" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Data Scraper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Full Database Refresh</h3>
                  <p className="text-sm text-muted-foreground">
                    Scrape all 32,000+ SBIR/STTR topics from DoD website and update database.
                    This process takes 5-6 hours and should be run daily.
                  </p>
                  <Button 
                    onClick={startScraper} 
                    disabled={loading || scraperStatus === 'running'}
                    className="w-full"
                  >
                    {scraperStatus === 'running' ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Scraper Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Full Refresh
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Quick Status Check</h3>
                  <p className="text-sm text-muted-foreground">
                    Check for new or updated topics without full refresh.
                    Faster but may miss some updates.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={checkScraperStatus}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Scraper Status</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={scraperStatus === 'running' ? 'default' : 'secondary'}>
                    {scraperStatus === 'running' ? 'Running' : 'Idle'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last checked: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Search Term</label>
                    <Input
                      placeholder="Search titles, descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Component</label>
                    <select
                      value={selectedComponent}
                      onChange={(e) => setSelectedComponent(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">All Components</option>
                      {stats?.components?.map(comp => (
                        <option key={comp.component} value={comp.component}>
                          {comp.component}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">All Statuses</option>
                      {stats?.statuses?.map(status => (
                        <option key={status.status} value={status.status}>
                          {status.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="created_date">Created Date</option>
                      <option value="title">Title</option>
                      <option value="component">Component</option>
                      <option value="status">Status</option>
                      <option value="days_until_close">Days Until Close</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sort Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                <Button onClick={fetchRecords} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Search Records
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
