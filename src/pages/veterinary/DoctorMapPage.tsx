import DashboardLayout from '@/components/layout/DashboardLayout';
import NearbyDoctorsMap from '@/components/veterinary/NearbyDoctorsMap';

export default function DoctorMapPage() {
  return (
    <DashboardLayout 
      title="Nearby Doctors" 
      subtitle="Find veterinary doctors in your area"
    >
      <NearbyDoctorsMap />
    </DashboardLayout>
  );
}
