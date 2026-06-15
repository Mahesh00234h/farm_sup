import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VetProfile {
  id: string;
  user_id: string;
  license_number: string;
  specialization?: string;
  experience_years: number;
  consultation_fee: number;
  is_verified: boolean;
  is_available: boolean;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  certificate_url?: string;
  rating: number;
  total_consultations: number;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

interface Consultation {
  id: string;
  farmer_id?: string;
  vet_id: string;
  disease_detection_id?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  consultation_type: 'chat' | 'video' | 'in_person';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  prescription?: string;
  rating?: number;
  fee_paid: number;
  created_at: string;
  updated_at: string;
  // Joined data
  farmer_name?: string;
  farmer_email?: string;
}

export function useVetProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createProfile = async (data: Partial<VetProfile>) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('vet_profiles')
        .insert({
          user_id: user.id,
          license_number: data.license_number || '',
          specialization: data.specialization,
          experience_years: data.experience_years || 0,
          consultation_fee: data.consultation_fee || 0,
          location_lat: data.location_lat,
          location_lng: data.location_lng,
          location_address: data.location_address,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setProfile(newProfile);
      toast.success('Profile created successfully!');
      return newProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<VetProfile>) => {
    if (!user || !profile) return null;

    setIsLoading(true);
    try {
      const { data: updated, error: updateError } = await supabase
        .from('vet_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProfile(updated);
      toast.success('Profile updated successfully!');
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading, error, fetchProfile, createProfile, updateProfile };
}

export function useConsultations() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConsultations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations((data || []) as Consultation[]);
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConsultations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('consultations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultations' },
        () => {
          fetchConsultations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConsultations]);

  const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Consultation updated');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update';
      toast.error(message);
      return false;
    }
  };

  return { consultations, isLoading, fetchConsultations, updateConsultation };
}

export function useNearbyVets() {
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNearbyVets = useCallback(async (lat?: number, lng?: number) => {
    setIsLoading(true);
    try {
      // Fetch all verified vets with location
      const { data, error } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('is_verified', true)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      if (error) throw error;

      // If user location provided, sort by distance
      if (lat && lng && data) {
        const withDistance = data.map(vet => ({
          ...vet,
          distance: calculateDistance(lat, lng, vet.location_lat!, vet.location_lng!),
        }));
        withDistance.sort((a, b) => a.distance - b.distance);
        setVets(withDistance);
      } else {
        setVets(data || []);
      }
    } catch (err) {
      console.error('Error fetching vets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { vets, isLoading, fetchNearbyVets };
}

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
