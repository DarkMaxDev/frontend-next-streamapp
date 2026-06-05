import { AuthProvider } from "../components/AuthProvider";
import Navbar from "../components/Navbar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#141414] text-white">
        <AuthProvider> 
          <Navbar /> 
          <main className="pt-24"> 
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}