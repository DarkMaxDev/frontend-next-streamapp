"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterSuccessResponse {
    msg: string;
}

interface RegisterErrorResponse {
    msg?: string;
    error?: string;
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                })
            });

            if (res.ok) {
                // Tipamos la respuesta como éxito estricto
                const data: RegisterSuccessResponse = await res.json();
                alert(data.msg || "¡Usuario registrado con éxito!");
                
                router.push('/login');
                router.refresh();
            } else {
                const errorData: RegisterErrorResponse = await res.json();
                
                const errorMessage = errorData.msg || errorData.error || "Error al registrarse";
                alert(errorMessage);
            }
        } catch (error) {
            console.error("Error en registro:", error);
            alert("Hubo un error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black">
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
                <h1 className="text-3xl font-bold text-white mb-8">Crea tu cuenta</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        name="username"
                        required
                        value={formData.username}
                        placeholder="Nombre de usuario"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        placeholder="Correo electrónico"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        placeholder="Contraseña"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <input 
                        type="password" 
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        placeholder="Confirmar contraseña"
                        className="w-full p-4 bg-[#333] text-white rounded outline-none border-b-2 border-transparent focus:border-red-600 transition-all"
                        onChange={handleChange}
                    />

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded mt-6 transition-transform active:scale-95 disabled:bg-red-800"
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </form>

                <div className="mt-8 text-gray-500 text-sm">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="text-white font-medium hover:underline">
                        Inicia sesión aquí.
                    </Link>
                </div>
            </div>
        </div>
    );
}