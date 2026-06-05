import { AuthProvider } from "../components/AuthProvider";
import Navbar from "../components/Navbar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#141414] text-white">
        <AuthProvider> 
          {/* ✅ Correcto: Navbar dentro de AuthProvider */}
          <Navbar /> 
          <main className="pt-24"> {/* Espacio para que el Navbar no tape el contenido */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}