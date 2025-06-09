import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, User as UserIcon, Trash2, Search, UserX, UserCheck, UserMinus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await apiService.request('/users');
        if (Array.isArray(fetchedUsers)) {
          setUsers(fetchedUsers);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const sortedAndFilteredUsers = useMemo(() => {
    const roleOrder = { owner: 0, admin: 1, user: 2 };

    return users
      .filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.role !== b.role) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        if (a.role === 'user') {
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [users, searchTerm]);

  const makeAdmin = async (id: string) => {
    try {
      await apiService.request(`/users/${id}/make-admin`, { method: 'PUT' });
      setUsers(users.map(u => u._id === id ? { ...u, role: 'admin' } : u));
    } catch (error) {
      console.error('Error making user admin:', error);
    }
  };

  const removeAdmin = async (id: string) => {
    try {
      await apiService.request(`/users/${id}/remove-admin`, { method: 'PUT' });
      setUsers(users.map(u => u._id === id ? { ...u, role: 'user' } : u));
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiService.request(`/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u._id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role: 'user' | 'admin' | 'owner') => {
    switch (role) {
      case 'owner':
        return <Badge variant="destructive">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Admin</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="glass">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">Admin Panel</CardTitle>
            <CardDescription>Manage users and their roles across the platform.</CardDescription>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredUsers.map(u => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Make Admin Button */}
                        {(user?.role === 'admin' || user?.role === 'owner') && u.role === 'user' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center justify-center gap-2 whitespace-nowrap"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">Make Admin</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Make {u.name} an Admin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will grant admin privileges to {u.name}. They will be able to:
                                  <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Edit and delete any content</li>
                                    <li>Manage user roles (for owners)</li>
                                    <li>Access all admin features</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => makeAdmin(u._id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Make Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Remove Admin Button (Owner only) */}
                        {user?.role === 'owner' && u.role === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex items-center justify-center gap-2 whitespace-nowrap"
                              >
                                <UserMinus className="h-4 w-4" />
                                <span className="hidden sm:inline">Remove Admin</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin Privileges?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will revoke admin privileges from {u.name}. They will be downgraded to a regular user.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => removeAdmin(u._id)}
                                  className="bg-amber-600 hover:bg-amber-700"
                                >
                                  Remove Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Delete User Button (Owner only, can't delete self) */}
                        {user?.role === 'owner' && u._id !== user?._id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex items-center justify-center gap-2 whitespace-nowrap"
                              >
                                <UserX className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete User</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {u.name}'s Account?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>This action cannot be undone. This will permanently delete {u.name}'s account and all associated data.</p>
                                  <p className="font-medium text-destructive">
                                    Warning: This action is irreversible and will remove all user data.
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUser(u._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel; 