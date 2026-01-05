import AdminShell from '../AdminShell';
import { AdminConfirmProvider } from '../AdminConfirm';

export default function AdminDashboardLayout({ children }) {
  return (
    <AdminConfirmProvider>
      <AdminShell>{children}</AdminShell>
    </AdminConfirmProvider>
  );
}
