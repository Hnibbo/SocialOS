
interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Now using unified AppLayout shell, this is just a content wrapper for admin styling
  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {children}
    </div>
  );
}
