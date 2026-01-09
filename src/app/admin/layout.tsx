// layout.tsx
import AdminHeader from '@/components/AdminHeader'

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <AdminHeader>{children}</AdminHeader>
    </div>
  )
}
