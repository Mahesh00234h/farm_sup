import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  Loader2, 
  FileText, 
  MapPin,
  Stethoscope,
  Award,
  DollarSign,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useVetProfile } from '@/hooks/useVeterinary';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCurrentPosition } from '@/lib/nativeGeolocation';

export default function VetProfileSetup() {
  const { user } = useAuth();
  const { profile, isLoading, createProfile, updateProfile, fetchProfile } = useVetProfile();
  
  const [formData, setFormData] = useState({
    license_number: '',
    specialization: '',
    experience_years: 0,
    consultation_fee: 0,
    location_address: '',
    location_lat: 0,
    location_lng: 0,
  });
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        license_number: profile.license_number || '',
        specialization: profile.specialization || '',
        experience_years: profile.experience_years || 0,
        consultation_fee: profile.consultation_fee || 0,
        location_address: profile.location_address || '',
        location_lat: profile.location_lat || 0,
        location_lng: profile.location_lng || 0,
      });
      if (profile.certificate_url) {
        setCertificatePreview(profile.certificate_url);
      }
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setCertificateFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCertificatePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadCertificate = async (): Promise<string | null> => {
    if (!certificateFile || !user) return profile?.certificate_url || null;

    setIsUploading(true);
    try {
      const fileExt = certificateFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vet-certificates')
        .upload(fileName, certificateFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vet-certificates')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload certificate';
      toast.error(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await getCurrentPosition();
      const { latitude, longitude } = coords;
      setFormData(prev => ({
        ...prev,
        location_lat: latitude,
        location_lng: longitude,
      }));
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            setFormData(prev => ({ ...prev, location_address: data.display_name }));
          }
        }
      } catch (err) {
        console.error('Reverse geocoding failed:', err);
      }
      toast.success('Location updated');
    } catch (error: any) {
      toast.error('Could not get location: ' + (error?.message || 'unknown'));
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.license_number) {
      toast.error('License number is required');
      return;
    }

    setIsSaving(true);
    try {
      // Upload certificate if new file selected
      const certificateUrl = await uploadCertificate();

      const profileData = {
        ...formData,
        certificate_url: certificateUrl,
      };

      if (profile) {
        await updateProfile(profileData);
      } else {
        await createProfile(profileData);
      }

      await fetchProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeCertificate = () => {
    setCertificateFile(null);
    setCertificatePreview(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Profile Setup" subtitle="Complete your veterinary profile">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Profile Setup" 
      subtitle="Complete your veterinary profile for verification"
    >
      <div className="max-w-2xl mx-auto">
        {/* Verification Status */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 mb-6 flex items-center gap-3",
              profile.is_verified 
                ? "bg-success/10 border border-success/20" 
                : "bg-warning/10 border border-warning/20"
            )}
          >
            {profile.is_verified ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Profile Verified</p>
                  <p className="text-sm text-muted-foreground">
                    Your profile is visible to farmers seeking consultations
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Pending Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Your profile is under review. Upload your certificate to expedite verification.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* License Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">License Information</h3>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="e.g., VET-12345-IN"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g., Large Animal Medicine, Poultry Health"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="experience_years"
                      type="number"
                      min={0}
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="consultation_fee"
                      type="number"
                      min={0}
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Certificate Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Verification Certificate</h3>
            </div>

            {certificatePreview ? (
              <div className="relative">
                <div className="border-2 border-dashed border-success rounded-xl p-4 bg-success/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-success/10 text-success">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Certificate uploaded</p>
                      <p className="text-sm text-muted-foreground">
                        {certificateFile?.name || 'Previously uploaded'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeCertificate}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Upload your certificate</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, JPG or PNG (max 5MB)
                  </p>
                </div>
              </label>
            )}
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Practice Location</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="location_address">Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  placeholder="Your clinic or practice address"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Use Current Location
                  </>
                )}
              </Button>

              {formData.location_lat !== 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  📍 {formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)}
                </p>
              )}
            </div>
          </motion.div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSaving || isUploading}
          >
            {isSaving || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading certificate...' : 'Saving...'}
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" />
                {profile ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
