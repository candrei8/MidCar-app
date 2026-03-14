import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthGuard } from "@/components/auth/AuthGuard"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <TooltipProvider>
                <div className="min-h-screen bg-[#f6f6f8]">
                    <Header />
                    <main className="pb-24 lg:pb-6">
                        {children}
                    </main>
                    <BottomNav />
                </div>
            </TooltipProvider>
        </AuthGuard>
    )
}
