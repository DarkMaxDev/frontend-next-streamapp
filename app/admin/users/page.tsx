"use client";
import { useEffect, useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../utils/api'; 
import { User } from '../../types';          

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Obtener usuarios de la API
  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/users') as User[];
      setUsers(data);
    } catch (err) {
      console.error("Error al obtener la lista de usuarios:", err);
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchUsers();
    });
  }, [fetchUsers]);

  // Modificar usuario conectando con tu ruta PUT /admin/user/:id/manage
  const handleUpdateUserFields = async (userId: string, updatedFields: Partial<User>) => {
    const usuarioActual = users.find(u => u._id === userId);
    if (!usuarioActual) return;

    // Estructura limpia y tipada que espera exactamente tu req.body en Express
    const bodyCompleto = {
      plan: updatedFields.plan !== undefined ? updatedFields.plan : usuarioActual.plan,
      hasAds: updatedFields.hasAds !== undefined ? updatedFields.hasAds : usuarioActual.hasAds,
      role: updatedFields.role !== undefined ? updatedFields.role : usuarioActual.role,
      subscriptionEnd: updatedFields.subscriptionEnd !== undefined ? updatedFields.subscriptionEnd : usuarioActual.subscriptionEnd,
    };

    try {
      // Optimistic UI: Cambia en pantalla inmediatamente para una experiencia fluida
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updatedFields } : u));
      
      // Llamada exacta a tu backend existente
      await apiFetch(`/admin/user/${userId}/manage`, {
        method: 'PUT',
        body: JSON.stringify(bodyCompleto)
      });
    } catch (err) {
      console.error("Error al modificar el usuario:", err);
      alert("No se pudo actualizar en el servidor. Revirtiendo...");
      startTransition(() => {
        fetchUsers();
      });
    }
  };

  // Corregido: Alterna estrictamente entre los dos estados reales de tu base de datos
  const handleChangePlan = (userId: string, currentPlan: User['plan']) => {
    const siguientePlan: User['plan'] = currentPlan === 'vip' ? 'free' : 'vip';
    handleUpdateUserFields(userId, { plan: siguientePlan });
  };

  // Filtro de búsqueda en memoria seguro (protegido contra campos undefined)
  const filteredUsers = users.filter(user => 
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-10 text-white bg-[#141414] min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Cargando panel de control...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-white bg-[#141414] min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <button 
          onClick={() => startTransition(() => { fetchUsers(); })} 
          className="bg-white text-black px-5 py-2 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-[#141414] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-gray-400 mt-1">Gestiona los accesos de tus usuarios y el catálogo multimedia.</p>
          </div>
          <Link 
            href="/admin/content" 
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition text-sm shadow-lg shadow-blue-600/20 active:scale-95"
          >
            🎬 Agregar Películas / Anime
          </Link>
        </div>

        {/* BUSCADOR */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">🔍</span>
            <input 
              type="text"
              placeholder="Buscar usuarios por nombre o correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 pl-11 text-sm outline-none focus:border-blue-500 focus:bg-white/[0.07] transition text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] shadow-2xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 border-b border-white/10 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Usuario</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Estado de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-semibold text-gray-200">{u.username}</td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserFields(u._id, { role: e.target.value })}
                        className="bg-zinc-800 text-zinc-200 border border-white/10 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleChangePlan(u._id, u.plan)}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded border transition cursor-pointer ${
                          u.plan === 'vip'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {u.plan} {u.plan === 'vip' ? '⭐ VIP' : '⚙️ Cambiar'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleUpdateUserFields(u._id, { hasAds: !u.hasAds })}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                          u.hasAds 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                        }`}
                      >
                        {u.hasAds ? "Con Ads" : "Premium (Sin Ads) 🛡️"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}