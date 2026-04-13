import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, X, Play } from 'lucide-react';

export default function Exercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', muscleGroup: '', equipment: '', videoUrl: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);

  const canEdit = ['admin', 'trainer'].includes(user?.role);

  useEffect(() => { loadExercises(); loadMuscleGroups(); }, [search, muscleFilter]);

  const loadExercises = async () => {
    const params = {};
    if (search) params.search = search;
    if (muscleFilter) params.muscleGroup = muscleFilter;
    const res = await api.get('/exercises', { params });
    setExercises(res.data);
  };

  const loadMuscleGroups = async () => {
    const res = await api.get('/exercises/muscle-groups');
    setMuscleGroups(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    if (imageFile) formData.append('image', imageFile);

    if (editing) {
      await api.put(`/exercises/${editing.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await api.post('/exercises', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    resetForm();
    loadExercises();
    loadMuscleGroups();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ejercicio?')) return;
    await api.delete(`/exercises/${id}`);
    loadExercises();
  };

  const startEdit = (ex) => {
    setEditing(ex);
    setForm({ name: ex.name, description: ex.description || '', muscleGroup: ex.muscleGroup, equipment: ex.equipment || '', videoUrl: ex.videoUrl || '', imageUrl: ex.imageUrl || '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', description: '', muscleGroup: '', equipment: '', videoUrl: '', imageUrl: '' });
    setImageFile(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejercicios</h1>
        {canEdit && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={18} /> Nuevo Ejercicio
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
        </div>
        <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
          <option value="">Todos los grupos</option>
          {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-100">
              {ex.imageUrl ? (
                <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
              )}
              {ex.videoUrl && (
                <button onClick={() => setShowVideo(ex)} className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90">
                  <Play size={16} />
                </button>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{ex.name}</h3>
              <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{ex.muscleGroup}</span>
              {ex.equipment && <p className="text-sm text-gray-500 mt-1">{ex.equipment}</p>}
              {ex.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ex.description}</p>}
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => startEdit(ex)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"><Edit2 size={16} /></button>
                  {user.role === 'admin' && <button onClick={() => handleDelete(ex.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {exercises.length === 0 && <p className="text-center text-gray-500 mt-8">No se encontraron ejercicios</p>}

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">{showVideo.name}</h3>
              <button onClick={() => setShowVideo(null)}><X size={20} /></button>
            </div>
            <div className="aspect-video">
              <iframe src={showVideo.videoUrl} className="w-full h-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Editar' : 'Nuevo'} Ejercicio</h3>
              <button onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo muscular *</label>
                <input type="text" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" list="muscle-groups" />
                <datalist id="muscle-groups">{muscleGroups.map(g => <option key={g} value={g} />)}</datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipamiento</label>
                <input type="text" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100" />
                <p className="text-xs text-gray-400 mt-1">O URL de imagen:</p>
                <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Video (YouTube embed)</label>
                <input type="text" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://www.youtube.com/embed/..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
