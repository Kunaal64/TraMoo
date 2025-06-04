import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, MapPin, Info, Save, XCircle, Trash2, Edit, HeartCrack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import { getInitials } from '../utils/helpers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        country: user.country || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    // You might want to add client-side validation for file type/size here

    try {
      const response = await apiService.uploadMedia(file);
      setFormData((prev) => ({ ...prev, avatar: response.url }));
      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully. Click Save to apply changes.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(formData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
      setEditMode(false);
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

  const getFullAvatarUrl = (path) => {
    if (!path) return '/placeholder-avatar.png'; // A default placeholder
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  };

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
                {user?.avatar && <AvatarImage src={getFullAvatarUrl(formData.avatar || user.avatar)} alt={user.name || 'User Avatar'} className="object-cover w-full h-full" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-bold flex items-center justify-center">
                  {getInitials(user?.name || '')}
                </AvatarFallback>
              </Avatar>
              {editMode && (
                <Label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-primary-foreground cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Edit size={32} />
                </Label>
              )}
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={!editMode}
              />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground text-lg">{user.email}</p>
              {user.country && <p className="text-muted-foreground text-md">From: {user.country}</p>}
            </div>
          </div>

          {!editMode ? (
            <div className="space-y-6 text-foreground mt-8 p-6 bg-card rounded-xl shadow-inner border border-border/50">
              <div className="flex items-center gap-3 text-lg"><UserIcon size={22} className="text-primary" /> <span className="font-semibold">Name:</span> {user.name}</div>
              <div className="flex items-center gap-3 text-lg"><Mail size={22} className="text-primary" /> <span className="font-semibold">Email:</span> {user.email}</div>
              {user.country && <div className="flex items-center gap-3 text-lg"><MapPin size={22} className="text-primary" /> <span className="font-semibold">Country:</span> {user.country}</div>}
              {user.bio && <div className="flex items-start gap-3 text-lg"><Info size={22} className="text-primary mt-1" /> <span className="font-semibold">Bio:</span> <p className="break-words flex-1 text-base leading-relaxed">{user.bio}</p></div>}

              <Button onClick={() => setEditMode(true)} className="mt-8 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
                <Edit size={20} className="mr-2" />
                Edit Profile
              </Button>
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
                <Button variant="destructive" disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-3 px-6">
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
                <AlertDialogFooter className="flex justify-center space-x-4 mt-6">
                  <AlertDialogAction asChild>
                    <Button onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-3 w-full sm:w-auto order-1">
                      {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                  </AlertDialogAction>
                  <AlertDialogCancel asChild>
                    <Button 
                      variant="outline" 
                      className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-lg py-3 w-full sm:w-auto order-2"
                      onClick={() => {
                        toast({
                          title: 'Operation Cancelled',
                          description: <span className="text-center">Thank you for staying! Love from our side ❤️</span>,
                          variant: 'success',
                        });
                      }}
                    >
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