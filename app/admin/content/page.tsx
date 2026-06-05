"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../utils/api';
import { Content } from '../../types';

export default function AdminContentList() {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cargarCatalogo = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/content/all/list') as Content[];
      setCatalogo(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar el catálogo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activo = true;
    const inicializar = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/content/all/list') as Content[];
        if (activo) setCatalogo(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar el catálogo:", err);
      } finally {
        if (activo) setLoading(false);
      }
    };

    inicializar();
    return () => { activo = false; };
  }, []);

  const handleToggleStatus = async (item: Content) => {
    const nuevoEstado = item.status === 'en_emision' ? 'finalizada' : 'en_emision';
    setCatalogo(prev => prev.map(c => c._id === item._id ? { ...c, status: nuevoEstado } : c));

    try {
      await apiFetch(`/content/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nuevoEstado })
      });
      setMessage({ type: 'success', text: `Estado de "${item.titulo}" actualizado.` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'No se pudo cambiar el estado en el servidor.' });
      cargarCatalogo();
    }
  };

  const handleEliminarContenido = async (id: string, tituloObra: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente "${tituloObra}"?`)) return;

    try {
      await apiFetch(`/content/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: `"${tituloObra}" eliminado con éxito.` });
      setCatalogo(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el contenido.' });
    }
  };

  const catalogoFiltrado = catalogo.filter(item => {
    const coincideBusqueda = item.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             item.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtroTipo === 'todos' || item.tipo === filtroTipo;
    return coincideBusqueda && coincideFiltro;
  });

  return (
    <div className="p-6 md:p-10 bg-[#141414] min-h-screen text-white space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:underline">← Gestión de Usuarios</Link>
            <h1 className="text-3xl font-black tracking-tight mt-1">Control de Catálogo</h1>
          </div>
          <button
            onClick={() => router.push('/admin/content/form')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/10"
          >
            ➕ Registrar Nueva Obra
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm border ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text"
            placeholder="🔍 Buscar obras por título o sinopsis..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500 transition text-white"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white font-semibold"
          >
            <option value="todos">🎬 Todos los Formatos</option>
            <option value="anime">💥 Animes</option>
            <option value="serie">📺 Series</option>
            <option value="pelicula">🍿 Películas</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 italic animate-pulse">Cargando catálogo...</p>
        ) : catalogoFiltrado.length === 0 ? (
          <p className="text-sm text-gray-500 italic p-12 bg-white/[0.01] rounded-xl border border-white/5 text-center">No hay registros multimedia disponibles.</p>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase text-gray-400 bg-white/[0.01]">
                  <th className="p-4">Obra / Título</th>
                  <th className="p-4">Formato</th>
                  <th className="p-4 text-center">Acceso</th>
                  <th className="p-4 text-center">Estado de Emisión</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {catalogoFiltrado.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.imagen && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imagen} alt={item.titulo} className="w-9 h-12 object-cover rounded bg-zinc-800 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-xs">{item.titulo}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{item.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-gray-300 border border-white/5">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold ${item.isPremium ? 'text-amber-400' : 'text-gray-500'}`}>
                        {item.isPremium ? '⭐ Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {item.tipo === 'pelicula' ? (
                        <span className="text-xs text-gray-600 italic">No Aplica</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                            item.status === 'finalizada' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                              : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          }`}
                        >
                          {item.status === 'finalizada' ? '🔴 Finalizada' : '🟢 En Emisión'}
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/content/form?edit=${item._id}`)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl border border-transparent hover:border-blue-500/20 hover:bg-blue-500/5 transition-all"
                        >
                          ✏️ Modificar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarContenido(item._id, item.titulo)}
                          className="text-xs font-bold text-red-500 hover:text-red-400 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}