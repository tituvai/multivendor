import Header from "@/components/customer/Header";
import Footer from "@/components/customer/Footer";
import MobileNav from "@/components/customer/MobileNav";
import ThemeProvider from "@/components/common/ThemeProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export default function CustomerLayout({ children }) {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Header />
        <main className="flex-grow pb-16 md:pb-0 max-w-7xl w-full mx-auto px-4 py-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <Footer />
        <MobileNav />
      </div>
    </ThemeProvider>
  );
}