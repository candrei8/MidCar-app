import { Header } from "@/components/layout/Header"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 lg:px-6 py-6">
                    {children}
                </main>
            </div>
        </TooltipProvider>
    )
}
