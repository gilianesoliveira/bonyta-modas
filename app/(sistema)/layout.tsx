import Sidebar from "@/components/Sidebar";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-[230px] bg-[#05050a] min-h-screen">
        {children}
      </main>
    </div>
  );
}