import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, attendanceApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  Lock,
  AlertTriangle,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  Shield,
  BookOpen,
  GraduationCap,
  Users,
  Percent,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

const Profile: React.FC = () => {
  const { user, refreshUser, token } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasFaceprint, setHasFaceprint] = useState<boolean | null>(null);
  const [isCheckingFace, setIsCheckingFace] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState(user?.assignedStudents || []);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const MAX_VISIBLE = 3;



  // Check faceprint for students
  useEffect(() => {
    const checkFaceprint = async () => {
      try {
        const result = await authApi.checkFaceprint();
        setHasFaceprint(result);
      } catch (error) {
        console.error('Failed to check faceprint:', error);
        setHasFaceprint(false);
      } finally {
        setIsCheckingFace(false);
      }
    };

    if (user?.role === 'Student' || user?.role === 'Faculty') {
      checkFaceprint();
    } else {
      setIsCheckingFace(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'Faculty' && (!user.assignedStudents || user.assignedStudents.length === 0)) {
      const fetchAssignedStudents = async () => {
        try {
          const students = await usersApi.getUsers(); // fallback fetch
          setAssignedStudents(
            students.filter(s => s.proctor?._id === user._id)
          );

        } catch (err) {
          console.error('Failed to fetch assigned students:', err);
        }
      };
      fetchAssignedStudents();
    }
  }, [user]);

  // Fetch attendance stats for student or faculty
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      try {
        let attendanceRecords = [];
        if (user?.role === 'Student') {
          attendanceRecords = await attendanceApi.getMyAttendance();
        } else if (user?.role === 'Faculty') {
          attendanceRecords = await attendanceApi.getMyAttendance();
        }

        if (attendanceRecords.length === 0) {
          setAttendanceStats(null);
          return;
        }

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const absentDays = totalDays - presentDays;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        setAttendanceStats({ totalDays, presentDays, absentDays, percentage });
      } catch (err) {
        console.error('Failed to fetch attendance stats:', err);
        setAttendanceStats(null);
      }
    };

    if (user) fetchAttendanceStats();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    console.log('Starting profile update for:', user?.email);

    try {
      const updateData: { username?: string; email?: string; password?: string } = {};
      if (username !== user?.username) updateData.username = username;
      if (email !== user?.email) updateData.email = email;
      if (password) updateData.password = password;

      const updateDataX = updateData;
      updateDataX.password = password ? '********' : undefined; // Mask password for logging
      console.log('Update data prepared:', updateDataX);

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made to your profile.',
        });
        setIsUpdating(false);
        return;
      }

      await authApi.updateMe(updateData);
      await refreshUser();
      setPassword('');

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFaceRegister = () => {
    if (user?.regNo && token) {
      authApi.redirectToFaceRegister(user.regNo, token, user.email);
    }
  };

  const getRoleDetails = () => {
    switch (user?.role) {
      case 'Admin':
        return {
          icon: <Shield className="w-6 h-6" />,
          color: 'bg-destructive/10 text-destructive',
          description: 'Full system access and control',
        };
      case 'Faculty':
        return {
          icon: <BookOpen className="w-6 h-6" />,
          color: 'bg-accent/10 text-accent',
          description: 'Manage assigned students and attendance',
        };
      default:
        return {
          icon: <GraduationCap className="w-6 h-6" />,
          color: 'bg-primary/10 text-primary',
          description: 'View attendance and manage profile',
        };
    }
  };

  const roleDetails = getRoleDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      {/* Face Registration Warning */}
      {(user?.role === 'Student' || user?.role === 'Faculty') && !isCheckingFace && hasFaceprint === false && (
        <Card className="border-warning/50 bg-warning/5 animate-slide-up">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-warning/10">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning">Face Data Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your face data has not been registered. Please upload your face data to enable
                facial recognition attendance.
              </p>
            </div>
            <Button
              onClick={handleFaceRegister}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload Face Data
            </Button>
          </CardContent>
        </Card>
      )}

      {user?.role === 'Student' && !isCheckingFace && hasFaceprint === true && (
        <Card className="border-success/50 bg-success/5 animate-slide-up">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success">Face Data Registered</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your face data is registered and ready for attendance recognition.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Percentage */}
      {attendanceStats && (
        <Card className="animate-slide-up">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">Attendance</h3>
              <p className="text-sm text-muted-foreground mt-1 space-y-1">
                <span className="block">
                  Present: {attendanceStats.presentDays} / {attendanceStats.totalDays} days
                </span>
                <span className="block">
                  Absent: {attendanceStats.absentDays} / {attendanceStats.totalDays} days
                </span>
                <span className="block font-medium">
                  Attendance Percentage: {attendanceStats.percentage}%
                </span>
              </p>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Proctor Info */}
      {user?.role === 'Student' && user?.proctor && (
        <Card className="animate-slide-up">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-accent/10">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-accent">Your Proctor</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Username: {user.proctor.username || user.proctor.email.split('@')[0]}
                <br />
                Email: <span className="text-xs">{user.proctor.email}</span>
                <br/>
                Register Number: {user.proctor.regNo ? user.proctor.regNo : 'No Register Number'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faculty Assigned Students */}
      {user?.role === 'Faculty' && assignedStudents.length > 0 && (
        <Card className="animate-slide-up">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Assigned Students
              </CardTitle>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                {assignedStudents.length} Students
              </span>
            </div>
            <CardDescription>
              Students under your proctorship
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {(showAllStudents
              ? assignedStudents
              : assignedStudents.slice(0, MAX_VISIBLE)
            ).map((s) => {
              const displayName = s.username || s.email.split('@')[0];

              return (
                <div
                  key={s._id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30
                       hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent
                            flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {displayName[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{displayName}</p>

                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold">
                        {s.regNo ? s.regNo : 'No Register Number'}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>

                </div>
              );
            })}

            {/* View More / Less */}
            {assignedStudents.length > MAX_VISIBLE && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAllStudents((prev) => !prev)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {showAllStudents
                    ? 'View less'
                    : `View all ${assignedStudents.length} students`}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground mb-4">
                {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold">
                {user?.username || user?.email.split('@')[0]}
              </h2>

              {user?.regNo ? (
                <div className="mt-1">
                  <p className="text-sm font-semibold">{user.regNo}</p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-sm font-semibold text-muted-foreground">No Register Number</p>
                </div>
              )}



              <p className="text-sm text-muted-foreground">{user?.email}</p>

              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${roleDetails.color}`}>
                {roleDetails.icon}
                <span className="font-semibold">{user?.role}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{roleDetails.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank if you don't want to change your password
                </p>
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
