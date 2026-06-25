import DashboardLayout from '@/components/ca3e3b76f8a3';
import TherapistGuardLayout from '@/components/037cd08ab774';

export default async function TherapistShellLayout({ children }) {
  return (
    <DashboardLayout>
      <TherapistGuardLayout>{children}</TherapistGuardLayout>
    </DashboardLayout>
  );
}
