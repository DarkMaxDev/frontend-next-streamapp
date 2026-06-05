"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider'; // Ajusta la ruta según donde tengas tu AuthProvider

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth(); // Usamos la función de login del contexto

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData) // { email, password }
        });

        if (res.ok) {
            const data = await res.json();
            // AQUÍ LLAMAS A TU FUNCIÓN CORRECTAMENTE
            // data.token y data.user vienen de tu backend
            login(data.token, data.user); 
            
            router.push('/');
        } else {
            alert("Credenciales incorrectas");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black">
            {/* Fondo */}
            <div 
                className="absolute inset-0 z-0 opacity-30"
                style={{ 
                    backgroundImage: 'url("https://previews.123rf.com/images/obolenskaya/obolenskaya2110/obolenskaya211000108/176673918-cinema-tv-shows-series-and-movies-funny-doodle-vector-set-hand-drawn-colorful-illustration-set.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            ></div>

            {/* Contenedor del Formulario */}
            <div className="relative z-10 w-full max-w-md p-10 bg-black/80 rounded-md border border-white/10 backdrop-blur-md shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-8">Iniciar Sesión</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="Correo electrónico"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <input 
                        type="password" 
                        name="password"
                        required
                        placeholder="Contraseña"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded mt-6 transition-transform active:scale-95 disabled:bg-red-800"
                    >
                        {loading ? 'Accediendo...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 text-gray-500 text-sm">
                    ¿Aún no tienes cuenta?{' '}
                    <Link href="/register" className="text-white font-medium hover:underline">
                        Regístrate aquí.
                    </Link>
                </div>
            </div>
        </div>
    );
}