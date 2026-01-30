import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/stat-card';
import { usersApi, attendanceApi, User, AttendanceRecord } from '@/lib/api';
import {
  Users,
  ClipboardList,
  UserCheck,
  UserX,
  GraduationCap,
  BookOpen,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'Admin' || user?.role === 'Faculty') {
          const usersData = await usersApi.getUsers();
          setUsers(usersData);
        }

        if (user?.role === 'Admin') {
          const attendanceData = await attendanceApi.getFullAttendance();
          setAttendance(attendanceData);
        } else if (user?.role === 'Faculty') {
          const attendanceData = await attendanceApi.getFacultyAttendance();
          setAttendance(attendanceData);
        } else if (user?.role === 'Student') {
          const attendanceData = await attendanceApi.getMyAttendance();
          setAttendance(attendanceData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const totalRecords = attendance.length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const studentCount = users.filter((u) => u.role === 'Student').length;
  const facultyCount = users.filter((u) => u.role === 'Faculty').length;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'Admin':
        return <Shield className="w-5 h-5" />;
      case 'Faculty':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <GraduationCap className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getWelcomeMessage()}, {user?.username || user?.email.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {getRoleIcon()}
            <span>{user?.role} Dashboard</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border shadow-sm">
          <TrendingUp className="w-5 h-5 text-success" />
          <span className="font-semibold">{attendanceRate}%</span>
          <span className="text-muted-foreground text-sm">Attendance Rate</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(user?.role === 'Admin' || user?.role === 'Faculty') && (
          <>
            <StatCard
              title="Total Students"
              value={studentCount}
              icon={GraduationCap}
              variant="primary"
              description={user?.role === 'Faculty' ? 'Assigned to you' : 'In the system'}
            />
            {user?.role === 'Admin' && (
              <StatCard
                title="Faculty Members"
                value={facultyCount}
                icon={BookOpen}
                variant="accent"
                description="Active instructors"
              />
            )}
          </>
        )}

        <StatCard
          title="Total Records"
          value={totalRecords}
          icon={ClipboardList}
          variant="default"
          description="Attendance entries"
        />

        <StatCard
          title="Present"
          value={presentCount}
          icon={UserCheck}
          variant="success"
          description={`${attendanceRate}% rate`}
        />

        <StatCard
          title="Absent"
          value={absentCount}
          icon={UserX}
          variant="warning"
          description={`${totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0}% rate`}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.slice(0, 5).map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'present'
                        ? 'bg-success/10 text-success'
                        : record.status === 'late'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        }`}
                    >
                      {record.status === 'present' ? (
                        <UserCheck className="w-5 h-5" />
                      ) : (
                        <UserX className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        <span className="px-2 py-1 inline-block bg-primary/10 text-primary text-sm font-mono rounded">
                        {record.regNo}</span>
                        {record.email && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({record.email})
                          </span>
                        )}
                      </p>


                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${record.status === 'present'
                      ? 'bg-success/10 text-success'
                      : record.status === 'late'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                      }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
