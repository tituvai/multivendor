import AdminLayoutClient from "@/components/admin/Adminlayoutclient";


export default function AdminLayout({ children }) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}