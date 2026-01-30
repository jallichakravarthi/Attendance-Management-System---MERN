import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceApi, AttendanceRecord } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Search,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(''); // format: YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('');



  useEffect(() => {
    if (!user) {
      console.log('User not available yet');
      return;
    } // wait until user is available

    const fetchAttendance = async () => {
      console.log('Fetching attendance for user:', user);
      try {
        let data: AttendanceRecord[] = [];

        const role = user.role?.trim().toLowerCase(); // normalize case
        if (role === 'admin') {
          console.log('Fetching full attendance for Admin');
          data = await attendanceApi.getFullAttendance();
        } else if (role === 'faculty') {
          console.log('Fetching faculty and student attendance for Faculty');
          const [studentsAttendance, myAttendance] = await Promise.all([
            attendanceApi.getFacultyAttendance(),
            attendanceApi.getMyAttendance(),
          ]);
          data = [...myAttendance, ...studentsAttendance];
        } else if (role === 'student') {
          console.log('Fetching my attendance for Student');
          data = await attendanceApi.getMyAttendance();
        }

        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendance(data);
        setFilteredAttendance(data);
        console.log('Attendance data fetched:', data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);



  useEffect(() => {
    let filtered = attendance;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.regNo?.toUpperCase().includes(searchTerm.toUpperCase()
      ));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(
        (record) => new Date(record.date).getTime() >= new Date(startDate).getTime()
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (record) => new Date(record.date).getTime() <= new Date(endDate).getTime()
      );
    }

    setFilteredAttendance(filtered);
  }, [searchTerm, statusFilter, startDate, endDate, attendance]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <UserCheck className="w-4 h-4" />;
      case 'late':
        return <Clock className="w-4 h-4" />;
      default:
        return <UserX className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-success/10 text-success';
      case 'late':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-destructive/10 text-destructive';
    }
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Email', 'Student Reg No', 'Status'];
    const rows = filteredAttendance.map((record) => [
      new Date(record.date).toLocaleDateString(),
      record.email || 'N/A',
      record.regNo || 'N/A',
      record.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_export.csv';
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-xl w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'Student'
              ? 'View your attendance history'
              : user?.role === 'Faculty'
                ? 'View assigned students attendance'
                : 'View all attendance records'}
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <UserX className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col md:flex-row items-end gap-4 py-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 rounded-md shadow-sm"
                placeholder="Select start date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 rounded-md shadow-sm"
                placeholder="Select end date"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                className="h-11 mt-5"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear
              </Button>
            )}
          </div>


        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No attendance records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  {user?.role !== 'Student' && <TableHead>Student Reg No</TableHead>}
                  {user?.role !== 'Student' && <TableHead>Email</TableHead>}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={record._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </TableCell>
                    
                    {user?.role !== 'Student' && (
                      <TableCell className="font-medium">
                        <span className="px-2 py-1 inline-block bg-primary/10 text-primary text-xs font-mono rounded">
                        {record.studentName || record.regNo}
                        </span>
                      </TableCell>
                    )}
                    {user?.role !== 'Student' && (
                      <TableCell className="text-muted-foreground">
                        {record.email || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
