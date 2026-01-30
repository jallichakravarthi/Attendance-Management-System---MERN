import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, User, AttendanceRecord, attendanceApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Eye,
  Shield,
  BookOpen,
  GraduationCap,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface NewUser {
  email: string;
  username: string;
  registerNumber: string;
  role: string;
}

const Users: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Add users dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsers, setNewUsers] = useState<NewUser[]>([
    { email: '', username: '', registerNumber: '', role: 'Student' }
  ]);

  const [bulkInput, setBulkInput] = useState('');
  const [isAddingUsers, setIsAddingUsers] = useState(false);

  // Edit user dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
    proctor: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // View user dialog
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord[]>>({});

  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  // 'all', '<75', '>=75', etc.



  useEffect(() => {
    fetchUsers();
  }, []);


  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        let records: AttendanceRecord[] = [];
        if (user?.role === 'Admin') {
          records = await attendanceApi.getFullAttendance();
        } else if (user?.role === 'Faculty') {
          records = await attendanceApi.getFacultyAttendance();
        } else {
          records = await attendanceApi.getMyAttendance();
        }

        // group by email
        const map: Record<string, AttendanceRecord[]> = {};
        records.forEach((rec) => {
          if (!map[rec.email]) map[rec.email] = [];
          map[rec.email].push(rec);
        });

        setAttendanceMap(map);
      } catch (err) {
        console.error('Failed to fetch attendance', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch attendance',
          variant: 'destructive',
        });
      }
    };

    fetchAttendance();
  }, [user]);


  const fetchUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.regNo?.toUpperCase().includes(searchTerm.toUpperCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-4 h-4" />;
      case 'Faculty':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <GraduationCap className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-destructive/10 text-destructive';
      case 'Faculty':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const addNewUserRow = () => {
    setNewUsers([...newUsers, { email: '', username: '', registerNumber: '', role: 'Student' }]);
  };

  const removeUserRow = (index: number) => {
    setNewUsers(newUsers.filter((_, i) => i !== index));
  };

  const updateUserRow = (index: number, field: keyof NewUser, value: string) => {
    const updated = [...newUsers];
    updated[index][field] = value;
    setNewUsers(updated);
  };

  const parseBulkInput = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const parsed = lines.map(line => {
      const [email, username, registerNumber] = line
        .split(',')
        .map(s => s.trim());

      return {
        email: email || '',
        username: username || '',
        registerNumber: registerNumber || '',
        role: 'Student',
      };
    });

    if (parsed.length > 0) {
      setNewUsers(prev => {
        if (prev.length === 1 && prev[0].email === '' && prev[0].registerNumber === '') {
          return parsed;
        }
        return [...prev, ...parsed];
      });
      setBulkInput('');
    }
  };


  const handleAddUsers = async () => {
    console.log("Handling add users: newUsers:", newUsers);
    const validUsers = newUsers.filter(
      u => u.email.trim() && u.registerNumber.trim()
    );

    if (validUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one user with an email',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingUsers(true);
    try {
      console.log('Adding users:', validUsers);
      await await usersApi.addUsers(
        validUsers.map(u => ({
          email: u.email,
          username: u.username || undefined,
          regNo: u.registerNumber, // <-- use backend field
          role: user?.role === 'Faculty' ? 'Student' : u.role,
        }))
      );


      toast({
        title: 'Success',
        description: `${validUsers.length} user(s) added successfully`,
      });
      setIsAddOpen(false);
      setNewUsers([{ email: '', username: '', registerNumber: '', role: 'Student' }]);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add users',
        variant: 'destructive',
      });
    } finally {
      setIsAddingUsers(false);
    }
  };

  const openEditDialog = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      username: u.username || '',
      email: u.email,
      role: u.role,
      password: '',
      proctor: typeof u.proctor === 'object' ? u.proctor?._id || '' : u.proctor || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);

    try {
      const payload: any = {
        userId: selectedUser._id,
      };

      // Common fields
      if (editForm.username.trim()) payload.username = editForm.username.trim();
      if (editForm.email.trim()) payload.email = editForm.email.trim();
      if (editForm.password.trim()) payload.password = editForm.password;

      // Role change (Admin only anyway)
      if (editForm.role && editForm.role !== selectedUser.role) {
        payload.role = editForm.role;
      }

      // 🎓 Proctor ONLY if final role is Student
      const finalRole = editForm.role || selectedUser.role;
      if (finalRole === 'Student') {
        payload.proctor = editForm.proctor || null;
      }

      await usersApi.adminUpdateUser(payload);

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };


  const openViewDialog = async (u: User) => {
    try {
      const fullUser = await usersApi.getUserById(u._id);
      console.log('Full user data at view dialog:', fullUser);
      setViewUser(fullUser);
      setIsViewOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'Student').length,
    faculty: users.filter((u) => u.role === 'Faculty').length,
    admins: users.filter((u) => u.role === 'Admin').length,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'Admin'
              ? 'Manage all users in the system'
              : 'Manage your assigned students'}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <UserPlus className="w-4 h-4" />
              Add Users
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Users</DialogTitle>
              <DialogDescription>
                Add users individually or paste bulk data (email, username, registerNumber per line)
              </DialogDescription>

            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Bulk Input */}
              <div className="space-y-2">
                <Label>Bulk Input (email,username,register number per line)</Label>
                <Textarea
                  placeholder="john@example.com,John Doe&#10;jane@example.com,Jane Smith"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={3}
                />
                <Button type="button" variant="outline" size="sm" onClick={parseBulkInput}>
                  Parse Bulk Input
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or add individually</span>
                </div>
              </div>

              {/* Individual Users */}
              <div className="space-y-4">
                {newUsers.map((newUser, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Email</Label>
                      <Input
                        placeholder="email@example.com"
                        value={newUser.email}
                        onChange={(e) => updateUserRow(index, 'email', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Register Number</Label>
                      <Input
                        placeholder="e.g. 21PV1A05D3"
                        value={newUser.registerNumber}
                        onChange={(e) =>
                          updateUserRow(index, 'registerNumber', e.target.value)
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label>Username</Label>
                      <Input
                        placeholder="Optional"
                        value={newUser.username}
                        onChange={(e) => updateUserRow(index, 'username', e.target.value)}
                      />
                    </div>
                    {user?.role === 'Admin' && (
                      <div className="w-32 space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(v) => updateUserRow(index, 'role', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Faculty">Faculty</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newUsers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUserRow(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full gap-2" onClick={addNewUserRow}>
                  <Plus className="w-4 h-4" />
                  Add Another
                </Button>
              </div>

              <Button
                onClick={handleAddUsers}
                disabled={isAddingUsers}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {isAddingUsers ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Add ${newUsers.filter((u) => u.email.trim()).length} User(s)`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <UsersIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.students}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.faculty}</p>
              <p className="text-xs text-muted-foreground">Faculty</p>
            </div>
          </CardContent>
        </Card>
        {user?.role === 'Admin' && (
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                  {user?.role === 'Admin' && <SelectItem value="Admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Attendance Filter */}
            <div className="w-full md:w-48">
              <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by attendance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attendance</SelectItem>
                  <SelectItem value="<75">Below 75%</SelectItem>
                  <SelectItem value=">=75">75% & Above</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Optional: Reset Filters Button */}
            {(searchTerm || roleFilter !== 'all' || attendanceFilter !== 'all') && (
              <Button
                variant="outline"
                className="h-11 md:mt-0 mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setAttendanceFilter('all');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>REG Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u._id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground">
                          {u.username?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium">
                          {u.username || u.email.split('@')[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 inline-block bg-primary/10 text-primary text-xs font-mono rounded">
                        {u.regNo ? u.regNo : 'N/A'}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                          u.role
                        )}`}
                      >
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        const records = attendanceMap[u.email] || [];
                        const total = records.length;
                        const presentCount = records.filter(r => r.status === 'present').length;
                        const absentCount = records.filter(r => r.status === 'absent').length;
                        const percentage = total ? Math.round((presentCount / total) * 100) : 0;

                        return total ? (
                          <div className="p-2 bg-muted rounded-lg flex flex-col gap-1 shadow-sm">
                            <span className="text-xs font-medium text-green-700">
                              Present: {presentCount} / {total} days
                            </span>
                            <span className="text-xs font-medium text-red-700">
                              Absent: {absentCount} / {total} days
                            </span>
                            <span className="text-xs font-medium text-blue-800">
                              Attendance Percentage: {percentage}%
                            </span>
                          </div>
                        ) : (
                          '-'
                        );
                      })()}
                    </TableCell>


                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(u)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user?.role === 'Admin' && (
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information based on role
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* Username */}
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>

              {/* Registration Number */}
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={selectedUser.regNo}
                  disabled
                  className="font-mono opacity-70"
                />
                <p className="text-xs text-muted-foreground">
                  Registration number cannot be changed
                </p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) =>
                    setEditForm({
                      ...editForm,
                      role: v,
                      // 🔥 auto-clear proctor if role changes
                      proctor: v === 'Student' ? editForm.proctor : '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 🎓 Proctor — ONLY for Students */}
              {editForm.role === 'Student' && (
                <div className="space-y-2">
                  <Label>Proctor</Label>
                  <Select
                    value={editForm.proctor}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, proctor: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => u.role === 'Faculty')
                        .map((faculty) => (
                          <SelectItem key={faculty._id} value={faculty._id}>
                            {faculty.regNo} — {faculty.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label>New Password (optional)</Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                />
              </div>

              {/* Save */}
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {viewUser.username?.[0]?.toUpperCase() || viewUser.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewUser.username || viewUser.email.split('@')[0]}
                  </h3>
                  <p className="text-muted-foreground">{viewUser.regNo}, {viewUser.email}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getRoleBadgeColor(
                      viewUser.role
                    )}`}
                  >
                    {getRoleIcon(viewUser.role)}
                    {viewUser.role}
                  </span>
                </div>
              </div>
              {viewUser.proctor && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Proctor</p>
                  <p className="font-medium text-sm">
                    {typeof viewUser.proctor === 'object'
                      ? viewUser.proctor.regNo + ", " + viewUser.proctor.email || viewUser.proctor.userName + ", " + viewUser.proctor.regNo
                      : viewUser.proctor}
                  </p>
                </div>
              )}
              {viewUser.assignedStudents && viewUser.assignedStudents.length > 0 && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Assigned Students</p>
                  <p className="font-medium">{viewUser.assignedStudents.length} students</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
