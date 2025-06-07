import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, MapPin, Info, Save, XCircle, Trash2, Edit, HeartCrack } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../utils/api';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const Profile = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);

  // Debounce for password verification
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        country: user.country || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      // Reset password verification status when user data changes
      setIsCurrentPasswordVerified(false);
    } else if (!authLoading && !user) {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to view your profile.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [user, authLoading, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle currentPassword verification separately
    if (name === 'currentPassword') {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (value.length > 0) {
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            await apiService.request('/auth/verify-current-password', {
              method: 'POST',
              body: JSON.stringify({ currentPassword: value }),
            });
            setIsCurrentPasswordVerified(true);
            toast({
              title: 'Success',
              description: 'Current password verified. You can now set your new password.',
            });
          } catch (error) {
            console.error('Error verifying current password:', error);
            setIsCurrentPasswordVerified(false);
            setFormData((prev) => ({ ...prev, newPassword: '', confirmNewPassword: '' })); // Clear new password fields
            toast({
              title: 'Error',
              description: error.message || 'Failed to verify current password.',
              variant: 'destructive',
            });
          }
        }, 500); // Debounce for 500ms
      } else {
        setIsCurrentPasswordVerified(false);
        setFormData((prev) => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData: { [key: string]: string } = {
        name: formData.name,
        email: formData.email,
        country: formData.country,
        bio: formData.bio,
      };

      if (formData.newPassword) { // Only consider new password if initiated
        if (!isCurrentPasswordVerified) {
          toast({
            title: 'Validation Error',
            description: 'Please verify your current password first.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
          toast({
            title: 'Validation Error',
            description: 'New password and confirm new password do not match.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
        updateData.currentPassword = formData.currentPassword; // Still send current password for backend validation
        updateData.newPassword = formData.newPassword;
      } else if (formData.currentPassword || formData.confirmNewPassword) {
        // If new password fields are empty but current or confirm are filled, it's an incomplete attempt
        toast({
          title: 'Validation Error',
          description: 'Please fill out all new password fields or clear current password to cancel.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      await apiService.request('/auth/update', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Manually update user state
      updateUser({
        ...user,
        name: formData.name,
        email: formData.email,
        country: formData.country,
        bio: formData.bio,
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
      setEditMode(false);
      // Clear password fields and reset verification status after successful save
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
      setIsCurrentPasswordVerified(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiService.request('/auth/delete', { method: 'DELETE' });
      logout(); // Log out the user after account deletion
      toast({
        title: 'Success',
        description: 'Your account has been successfully deleted.',
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-400">Loading profile...</div>;
  }

  if (!user) {
    return null; // Should redirect to login via useEffect
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass p-8 rounded-2xl shadow-lg border border-border"
        >
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">My Profile</h1>

          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-md group">
              <Avatar className="w-full h-full">
                <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-bold flex items-center justify-center">
                  {getInitials(user?.name || '')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground text-lg">{user.email}</p>
              {user.country && <p className="text-muted-foreground text-md">From: {user.country}</p>}
            </div>
          </div>

          {!editMode && (
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={() => setEditMode(true)} className="flex items-center gap-2">
                <Edit size={18} /> Edit Profile
              </Button>
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <Link to="/admin">
                  <Button className="flex items-center gap-2">
                    Admin's Space
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!editMode ? (
            <div className="space-y-6 text-foreground mt-8 p-6 bg-card rounded-xl shadow-inner border border-border/50">
              <div className="flex items-center gap-3 text-lg"><UserIcon size={22} className="text-primary" /> <span className="font-semibold">Name:</span> {user.name}</div>
              <div className="flex items-center gap-3 text-lg"><Mail size={22} className="text-primary" /> <span className="font-semibold">Email:</span> {user.email}</div>
              {user.country && <div className="flex items-center gap-3 text-lg"><MapPin size={22} className="text-primary" /> <span className="font-semibold">Country:</span> {user.country}</div>}
              {user.bio && <div className="flex items-start gap-3 text-lg"><Info size={22} className="text-primary mt-1" /> <span className="font-semibold">Bio:</span> <p className="break-words flex-1 text-base leading-relaxed">{user.bio}</p></div>}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6 mt-8 p-6 bg-card rounded-xl shadow-inner border border-border/50">
              <div>
                <Label htmlFor="name" className="block text-foreground text-sm font-bold mb-2">Name</Label>
                <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="glass-input p-3 text-base" />
              </div>
              <div>
                <Label htmlFor="email" className="block text-foreground text-sm font-bold mb-2">Email</Label>
                <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="glass-input p-3 text-base" />
              </div>
              <div>
                <Label htmlFor="country" className="block text-foreground text-sm font-bold mb-2">Country</Label>
                <Input type="text" id="country" name="country" value={formData.country} onChange={handleInputChange} className="glass-input p-3 text-base" />
              </div>
              <div>
                <Label htmlFor="bio" className="block text-foreground text-sm font-bold mb-2">Bio</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={5} className="glass-textarea p-3 text-base" />
              </div>

              {/* Password Change Section - Conditionally rendered */}
              {user && !user.isGoogleUser && user.email !== 'demo@tramoo.com' && (
                <div className="border-t border-border/50 pt-6 mt-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Change Password</h3>
                  <div>
                    <Label htmlFor="currentPassword" className="block text-foreground text-sm font-bold mb-2">Current Password</Label>
                    <Input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="glass-input p-3 text-base"
                      disabled={user?.isGoogleUser} // Disable if Google user
                    />
                  </div>
                  {isCurrentPasswordVerified && user && !user.isGoogleUser && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="space-y-4 mt-4"
                    >
                      <div>
                        <Label htmlFor="newPassword" className="block text-foreground text-sm font-bold mb-2">New Password</Label>
                        <Input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleInputChange} className="glass-input p-3 text-base" />
                      </div>
                      <div>
                        <Label htmlFor="confirmNewPassword" className="block text-foreground text-sm font-bold mb-2">Confirm New Password</Label>
                        <Input type="password" id="confirmNewPassword" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleInputChange} className="glass-input p-3 text-base" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              {user?.isGoogleUser && formData.currentPassword.length > 0 && (
                <p className="text-sm text-yellow-500 mt-2">Google users cannot change password directly.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button type="submit" disabled={isSaving} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
                  <Save size={20} className="mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" onClick={() => setEditMode(false)} variant="outline" className="flex-1 border-border text-foreground hover:bg-accent hover:text-accent-foreground text-lg py-3">
                  <XCircle size={20} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="mt-12 border-t-2 border-border pt-8 text-center">
            <h2 className="text-3xl font-bold text-destructive mb-4">Danger Zone</h2>
            <p className="text-muted-foreground mb-6 text-lg">Proceed with caution! This action is irreversible.</p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-3 px-6"
                  onClick={(e) => {
                    if (user?.email === 'demo@tramoo.com') {
                      e.preventDefault(); // Prevent AlertDialog from opening
                      toast({
                        title: "Goliii... beta MASTIII Nahiiii... ❤️", // Combined text and emoji with proper spacing
                        duration: 3000,
                      });
                    } else {
                      // For non-demo users, allow the AlertDialog to proceed
                      // The AlertDialogTrigger will handle opening the dialog
                    }
                  }}
                >
                  <Trash2 size={20} className="mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass p-8 rounded-3xl shadow-2xl border border-border/70 animate-in fade-in-90 zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:slide-in-from-left-2">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-center text-4xl font-extrabold text-foreground mb-4 leading-tight">
                    Are you sure you want to leave us?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-muted-foreground text-xl leading-relaxed font-medium">
                    "Abhi na jao choodhh kar dil abhi bhara nahi.." <HeartCrack size={28} className="inline-block ml-2 text-destructive align-middle" />
                    <br />
                    Deleting your account is permanent and cannot be undone. All your stories and comments will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                  <AlertDialogAction asChild>
                    <Button onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-3 px-8 rounded-full w-full sm:w-auto">
                      {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                  </AlertDialogAction>
                  <AlertDialogCancel asChild>
                    <Button 
                      variant="outline" 
                      className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-lg py-3 px-8 rounded-full w-full sm:w-auto mt-2 sm:mt-0"
                      onClick={() => toast({ title: 'Cancelled', description: 'Thank you for staying! Love from our side ❤️' })}> 
                      Cancel
                    </Button>
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile; 