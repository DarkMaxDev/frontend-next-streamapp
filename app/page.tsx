"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from './utils/api';
import Link from 'next/link';
import { Play, Info, Award, ChevronRight } from 'lucide-react';
import { Category, Content } from './types';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Content | null>(null);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await apiFetch('/categories') as Category[];
        setCategories(data);
        
        const rawFlatList = data.flatMap((c: Category) => c.contents || []);
        
        const uniqueFlatList = rawFlatList.filter((content, index, self) =>
          self.findIndex((c) => c._id === content._id) === index
        );
        
        if (uniqueFlatList.length > 0) {
          setFeatured(uniqueFlatList[Math.floor(Math.random() * uniqueFlatList.length)]);
          const shuffled = [...uniqueFlatList].sort(() => 0.5 - Math.random());
          setRecommendations(shuffled.slice(0, 6));
        }
      } catch (err) {
        console.error("Error al sincronizar catálogo:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-red-600/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="tracking-[0.3em] text-red-600 font-black text-2xl animate-pulse">STREAMAPP</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-32 overflow-x-hidden antialiased selection:bg-red-600 selection:text-white">
      <Navbar />

      <div 
        className="relative h-[92vh] w-full flex flex-col justify-end pb-32 px-6 sm:px-12 md:px-20 transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.8) 25%, rgba(10,10,10,0.2) 60%, rgba(0,0,0,0.7) 100%), url(${featured?.imagen || 'https://wallpapers.com/images/hd/dark-netflix-5nlvx66m2mqqqi8f.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%'
        }}
      >
        <div className="max-w-3xl z-10 space-y-5 md:space-y-6">
          <div className="flex items-center gap-2.5 animate-fade-in">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-950/40 px-3 py-1 rounded-full border border-red-500/20 backdrop-blur-md">
              {featured?.tipo || 'Original'}
            </span>
            {featured?.isPremium && (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> VIP ACCESS
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] max-w-2xl leading-[0.95]">
            {featured?.titulo || "Cargando Novedades"}
          </h1>
          
          <p className="text-zinc-300 text-sm sm:text-base drop-shadow-md line-clamp-3 leading-relaxed max-w-xl font-medium text-pretty">
            {featured?.descripcion || "Explora el catálogo definitivo lleno de producciones exclusivas de cine, anime y series sin límites."}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href={`/dashboard/watch/${featured?._id}`}
              className="flex items-center gap-3 bg-white text-black font-bold px-8 py-3.5 rounded-xl hover:bg-zinc-200 transition-all duration-300 shadow-xl active:scale-95 transform text-sm tracking-tight"
            >
              <Play className="fill-current w-4 h-4 text-black" /> Ver Ahora
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-12 md:px-20 space-y-16 -mt-24 relative z-30">
        {recommendations.length > 0 && (
          <div className="relative">
            <h2 className="text-sm md:text-base font-black uppercase tracking-[0.15em] mb-4 text-zinc-400 pl-1">
              Recomendados para ti
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.map((item) => (
                <Link 
                  key={item._id}
                  href={`/dashboard/watch/${item._id}`}
                  className="group relative bg-zinc-950 rounded-xl overflow-hidden border border-white/5 hover:border-red-500/30 transition-all duration-500 aspect-[16/9] shadow-2xl hover:scale-[1.04] hover:-translate-y-1 active:scale-98"
                >
                  <img 
                    src={item.imagen} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:brightness-75" 
                  />
                  {item.isPremium && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-md z-10 tracking-wider">
                      VIP
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <p className="text-xs font-bold text-white truncate w-full">{item.titulo}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-1">{item.tipo}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat._id} className="relative group/row">
            <div className="flex items-baseline justify-between mb-4 pl-1">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight cursor-pointer inline-flex items-center gap-2 group-hover/row:text-red-500 transition-colors duration-300">
                {cat.nombre}
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover/row:text-red-500 group-hover/row:translate-x-1 transition-all duration-300" />
              </h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 pt-1 -my-1 scrollbar-none scroll-smooth snap-x snap-mandatory">
              {cat.contents && cat.contents.length > 0 ? (
                cat.contents.map((item) => (
                  <Link
                    key={item._id}
                    href={`/dashboard/watch/${item._id}`}
                    className="w-[240px] sm:w-[280px] md:w-[320px] aspect-[16/9] bg-zinc-950 rounded-xl relative overflow-hidden group hover:scale-[1.04] hover:-translate-y-1 border border-white/5 hover:border-red-500/30 transition-all duration-500 shadow-xl flex-shrink-0 cursor-pointer snap-start"
                  >
                    {item.imagen ? (
                      <img 
                        src={item.imagen} 
                        alt={item.titulo} 
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:brightness-75" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-900 text-center border border-white/5">
                        <span className="text-zinc-400 text-xs font-semibold tracking-tight line-clamp-2">{item.titulo}</span>
                      </div>
                    )}

                    {item.isPremium && (
                      <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow z-10 tracking-wider">VIP</span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                      <p className="text-xs font-bold truncate w-full text-white">{item.titulo}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-600 text-xs italic pl-1 py-2">Próximamente más títulos disponibles.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}