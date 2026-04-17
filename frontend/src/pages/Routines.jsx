import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Trash2, Copy, Download, ChevronDown, ChevronUp, Edit2, Save, FileText, Table, Image, Timer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function Routines() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const launchWodTimer = (routine, day) => {
    navigate('/timer', {
      state: {
        wod: {
          routineName: routine.name,
          dayName: day.dayName,
          wodType: day.wodType,
          wodTimecap: day.wodTimecap,
          wodRounds: day.wodRounds,
          wodContent: day.wodContent,
        },
      },
    });
  };

  const [routines, setRoutines] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [users, setUsers] = useState([]);
  const [expandedRoutine, setExpandedRoutine] = useState(null);
  const [exportRoutine, setExportRoutine] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const routineRef = useRef(null);
  const canEdit = ['admin', 'trainer'].includes(user?.role);

  const [form, setForm] = useState({
    name: '', description: '', isTemplate: false, assignedTo: '',
    days: [{ dayName: 'Lunes', dayOrder: 0, exercises: [], wodType: '', wodContent: '', wodTimecap: '', wodRounds: '' }],
  });

  const wodTypes = ['AMRAP', 'EMOM', 'For Time', 'Tabata', 'Chipper', 'RFT (Rounds For Time)', 'Otro'];

  useEffect(() => { loadRoutines(); loadExercises(); if (canEdit) loadUsers(); }, []);

  const loadRoutines = async () => { const r = await api.get('/routines'); setRoutines(r.data); };
  const loadExercises = async () => { const r = await api.get('/exercises'); setExercises(r.data); };
  const loadUsers = async () => { const r = await api.get('/auth/users?role=user'); setUsers(r.data); };

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const addDay = () => {
    const usedDays = form.days.map(d => d.dayName);
    const next = dayNames.find(d => !usedDays.includes(d)) || `Día ${form.days.length + 1}`;
    setForm({ ...form, days: [...form.days, { dayName: next, dayOrder: form.days.length, exercises: [], wodType: '', wodContent: '', wodTimecap: '', wodRounds: '' }] });
  };

  const removeDay = (idx) => {
    setForm({ ...form, days: form.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayOrder: i })) });
  };

  const addExerciseToDay = (dayIdx) => {
    const days = [...form.days];
    days[dayIdx].exercises.push({ exerciseId: '', sets: 3, reps: '12', weight: 0, restSeconds: 60, order: days[dayIdx].exercises.length, notes: '' });
    setForm({ ...form, days });
  };

  const updateExercise = (dayIdx, exIdx, field, value) => {
    const days = [...form.days];
    days[dayIdx].exercises[exIdx][field] = value;
    setForm({ ...form, days });
  };

  const removeExercise = (dayIdx, exIdx) => {
    const days = [...form.days];
    days[dayIdx].exercises.splice(exIdx, 1);
    setForm({ ...form, days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      assignedTo: form.assignedTo || null,
      days: form.days.map((d, i) => ({
        ...d, dayOrder: i,
        exercises: d.exercises.map((ex, j) => ({ ...ex, order: j, exerciseId: parseInt(ex.exerciseId) }))
      }))
    };
    if (editing) {
      await api.put(`/routines/${editing.id}`, payload);
    } else {
      await api.post('/routines', payload);
    }
    resetBuilder();
    loadRoutines();
  };

  const startEdit = (routine) => {
    setEditing(routine);
    setForm({
      name: routine.name,
      description: routine.description || '',
      isTemplate: routine.isTemplate,
      assignedTo: routine.assignedTo || '',
      days: routine.days.map(d => ({
        dayName: d.dayName, dayOrder: d.dayOrder,
        wodType: d.wodType || '', wodContent: d.wodContent || '', wodTimecap: d.wodTimecap || '', wodRounds: d.wodRounds || '',
        exercises: d.exercises.map(ex => ({
          exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps, weight: ex.weight || 0,
          restSeconds: ex.restSeconds, order: ex.order, notes: ex.notes || ''
        }))
      }))
    });
    setShowBuilder(true);
  };

  const resetBuilder = () => {
    setShowBuilder(false);
    setEditing(null);
    setForm({ name: '', description: '', isTemplate: false, assignedTo: '', days: [{ dayName: 'Lunes', dayOrder: 0, exercises: [], wodType: '', wodContent: '', wodTimecap: '', wodRounds: '' }] });
  };

  const deleteRoutine = async (id) => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    await api.delete(`/routines/${id}`);
    loadRoutines();
  };

  const handleAssign = async () => {
    if (!assignTo) return;
    await api.post(`/routines/${assignModal.id}/assign`, { assignedTo: parseInt(assignTo) });
    setAssignModal(null);
    setAssignTo('');
    loadRoutines();
  };

  const updateUserWeight = async (exId, weight) => {
    await api.patch(`/routines/exercise/${exId}/weight`, { userWeight: parseFloat(weight) });
    loadRoutines();
  };

  // Export functions
  const exportPDF = (routine, dayFilter = null) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(routine.name, 14, 20);
    if (routine.description) { doc.setFontSize(10); doc.text(routine.description, 14, 28); }

    let y = 35;
    const days = dayFilter ? routine.days.filter(d => d.dayName === dayFilter) : routine.days;

    days.sort((a, b) => a.dayOrder - b.dayOrder).forEach(day => {
      doc.setFontSize(14);
      doc.text(day.dayName, 14, y);
      y += 5;

      const rows = day.exercises.sort((a, b) => a.order - b.order).map(ex => [
        ex.exercise?.name || 'N/A',
        ex.sets,
        ex.reps,
        ex.weight ? `${ex.weight} kg` : '-',
        ex.userWeight ? `${ex.userWeight} kg` : '-',
        ex.restSeconds ? `${ex.restSeconds}s` : '-',
        ex.notes || ''
      ]);

      doc.autoTable({
        startY: y,
        head: [['Ejercicio', 'Series', 'Reps', 'Peso', 'Mi Peso', 'Descanso', 'Notas']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [46, 125, 50] },
        margin: { left: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`${routine.name}${dayFilter ? ` - ${dayFilter}` : ''}.pdf`);
  };

  const exportExcel = (routine, dayFilter = null) => {
    const wb = XLSX.utils.book_new();
    const days = dayFilter ? routine.days.filter(d => d.dayName === dayFilter) : routine.days;

    days.sort((a, b) => a.dayOrder - b.dayOrder).forEach(day => {
      const data = day.exercises.sort((a, b) => a.order - b.order).map(ex => ({
        'Ejercicio': ex.exercise?.name || 'N/A',
        'Series': ex.sets,
        'Repeticiones': ex.reps,
        'Peso (kg)': ex.weight || '',
        'Mi Peso (kg)': ex.userWeight || '',
        'Descanso (s)': ex.restSeconds || '',
        'Notas': ex.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, day.dayName.substring(0, 31));
    });

    XLSX.writeFile(wb, `${routine.name}${dayFilter ? ` - ${dayFilter}` : ''}.xlsx`);
  };

  const exportJPG = async (routine) => {
    setExpandedRoutine(routine.id);
    setExportRoutine(routine.id);
    setTimeout(async () => {
      const el = document.getElementById(`routine-card-${routine.id}`);
      if (el) {
        const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
        const link = document.createElement('a');
        link.download = `${routine.name}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      }
      setExportRoutine(null);
    }, 500);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-brand-green-700">Rutinas</h1>
        {canEdit && (
          <button onClick={() => { resetBuilder(); setShowBuilder(true); }}
            className="flex items-center gap-2 bg-brand-green-500 text-white px-4 py-2 rounded-lg hover:bg-brand-green-600 transition-colors">
            <Plus size={18} /> Nueva Rutina
          </button>
        )}
      </div>

      {/* Routine List */}
      <div className="space-y-4">
        {routines.map((routine) => (
          <div key={routine.id} id={`routine-card-${routine.id}`}
            className="bg-white rounded-xl shadow-sm border border-brand-cream-dark overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
              onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-brand-green-700 text-lg">{routine.name}</h3>
                  {routine.isTemplate && <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Plantilla</span>}
                </div>
                {routine.description && <p className="text-sm text-gray-500 mt-1">{routine.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  {routine.creator && <span>Por: {routine.creator.name}</span>}
                  {routine.assignee && <span>Para: {routine.assignee.name}</span>}
                  <span>{routine.days?.length || 0} días</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Export dropdown */}
                <div className="relative group">
                  <button onClick={(e) => e.stopPropagation()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Download size={18} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-brand-cream-dark py-1 hidden group-hover:block z-10 min-w-[200px]">
                    <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase">Semana completa</p>
                    <button onClick={(e) => { e.stopPropagation(); exportPDF(routine); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-brand-cream"><FileText size={14} /> PDF</button>
                    <button onClick={(e) => { e.stopPropagation(); exportExcel(routine); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-brand-cream"><Table size={14} /> Excel</button>
                    <button onClick={(e) => { e.stopPropagation(); exportJPG(routine); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-brand-cream"><Image size={14} /> JPG</button>
                    {routine.days?.length > 0 && (
                      <>
                        <hr className="my-1" />
                        <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase">Por día</p>
                        {routine.days.sort((a, b) => a.dayOrder - b.dayOrder).map(day => (
                          <div key={day.id} className="px-3 py-1">
                            <p className="text-xs font-medium text-gray-600 mb-1">{day.dayName}</p>
                            <div className="flex gap-1 ml-2">
                              <button onClick={(e) => { e.stopPropagation(); exportPDF(routine, day.dayName); }} className="text-xs text-brand-green-500 hover:underline">PDF</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={(e) => { e.stopPropagation(); exportExcel(routine, day.dayName); }} className="text-xs text-brand-green-500 hover:underline">Excel</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <>
                    {routine.isTemplate && (
                      <button onClick={(e) => { e.stopPropagation(); setAssignModal(routine); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Asignar a usuario">
                        <Copy size={18} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); startEdit(routine); }} className="p-2 text-brand-green-500 hover:bg-brand-green-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                {expandedRoutine === routine.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded routine detail */}
            {(expandedRoutine === routine.id || exportRoutine === routine.id) && (
              <div className="border-t border-brand-cream-dark p-4 sm:p-5 space-y-4" ref={routineRef}>
                {routine.days?.sort((a, b) => a.dayOrder - b.dayOrder).map(day => (
                  <div key={day.id}>
                    <h4 className="font-semibold text-brand-green-600 mb-2 text-base">{day.dayName}</h4>
                    {day.wodType && (
                      <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold bg-orange-500 text-white rounded px-2 py-0.5">WOD</span>
                          <span className="text-sm font-semibold text-orange-800">{day.wodType}</span>
                          {day.wodTimecap && <span className="text-xs text-orange-600">Time Cap: {day.wodTimecap} min</span>}
                          {day.wodRounds && <span className="text-xs text-orange-600">Rondas: {day.wodRounds}</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); launchWodTimer(routine, day); }}
                            className="ml-auto flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors shadow-sm"
                            title="Iniciar timer con este WOD"
                          >
                            <Timer size={14} /> Iniciar Timer
                          </button>
                        </div>
                        {day.wodContent && <pre className="text-sm text-orange-900 whitespace-pre-wrap font-sans mt-1">{day.wodContent}</pre>}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-brand-cream">
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Ejercicio</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Series</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Reps</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Peso</th>
                            {user.role === 'user' && <th className="text-center px-3 py-2 font-medium text-gray-600">Mi Peso</th>}
                            <th className="text-center px-3 py-2 font-medium text-gray-600">Descanso</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {day.exercises?.sort((a, b) => a.order - b.order).map(ex => (
                            <tr key={ex.id} className="hover:bg-brand-cream">
                              <td className="px-3 py-2 font-medium">{ex.exercise?.name || 'N/A'}</td>
                              <td className="px-3 py-2 text-center">{ex.sets}</td>
                              <td className="px-3 py-2 text-center">{ex.reps}</td>
                              <td className="px-3 py-2 text-center">{ex.weight ? `${ex.weight} kg` : '-'}</td>
                              {user.role === 'user' && (
                                <td className="px-3 py-2 text-center">
                                  <input type="number" value={ex.userWeight || ''} placeholder="-"
                                    onChange={(e) => updateUserWeight(ex.id, e.target.value)}
                                    className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-green-500 outline-none" />
                                </td>
                              )}
                              <td className="px-3 py-2 text-center">{ex.restSeconds ? `${ex.restSeconds}s` : '-'}</td>
                              <td className="px-3 py-2 text-gray-500">{ex.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {routines.length === 0 && <p className="text-center text-gray-500 mt-8">No hay rutinas disponibles</p>}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Asignar "{assignModal.name}" a usuario</h3>
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-brand-green-500 outline-none">
              <option value="">Seleccionar usuario</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-brand-cream">Cancelar</button>
              <button onClick={handleAssign} disabled={!assignTo} className="flex-1 bg-brand-green-500 text-white px-4 py-2 rounded-lg hover:bg-brand-green-600 disabled:opacity-50">Asignar</button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editing ? 'Editar' : 'Nueva'} Rutina</h3>
              <button onClick={resetBuilder}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                  <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-500 outline-none">
                    <option value="">Sin asignar</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-500 outline-none" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isTemplate} onChange={e => setForm({ ...form, isTemplate: e.target.checked })}
                  className="w-4 h-4 text-brand-green-500 rounded" />
                <span className="text-sm font-medium text-gray-700">Guardar como plantilla estándar</span>
              </label>

              {/* Days */}
              <div className="space-y-4">
                {form.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="border border-brand-cream-dark rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <select value={day.dayName} onChange={e => {
                          const days = [...form.days];
                          days[dayIdx].dayName = e.target.value;
                          setForm({ ...form, days });
                        }} className="font-semibold text-brand-green-600 border border-gray-300 rounded px-2 py-1 text-sm">
                          {dayNames.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      {form.days.length > 1 && (
                        <button type="button" onClick={() => removeDay(dayIdx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* WOD Section */}
                    <div className="mb-3 border border-orange-200 rounded-lg p-3 bg-orange-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-orange-500 text-white rounded px-2 py-0.5">WOD</span>
                        <span className="text-xs text-gray-500">CrossFit (opcional)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-500">Tipo</label>
                          <select value={day.wodType || ''} onChange={e => {
                            const days = [...form.days];
                            days[dayIdx].wodType = e.target.value;
                            setForm({ ...form, days });
                          }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
                            <option value="">Sin WOD</option>
                            {wodTypes.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Time Cap (min)</label>
                          <input type="number" value={day.wodTimecap || ''} onChange={e => {
                            const days = [...form.days];
                            days[dayIdx].wodTimecap = e.target.value ? parseInt(e.target.value) : '';
                            setForm({ ...form, days });
                          }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-orange-400 outline-none" placeholder="-" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Rondas</label>
                          <input type="number" value={day.wodRounds || ''} onChange={e => {
                            const days = [...form.days];
                            days[dayIdx].wodRounds = e.target.value ? parseInt(e.target.value) : '';
                            setForm({ ...form, days });
                          }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-orange-400 outline-none" placeholder="-" />
                        </div>
                      </div>
                      {day.wodType && (
                        <div>
                          <label className="text-xs text-gray-500">Descripción del WOD</label>
                          <textarea value={day.wodContent || ''} onChange={e => {
                            const days = [...form.days];
                            days[dayIdx].wodContent = e.target.value;
                            setForm({ ...form, days });
                          }} rows={3} placeholder="Ej: 21-15-9&#10;Thrusters (43/30 kg)&#10;Pull-ups" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none" />
                        </div>
                      )}
                    </div>

                    {/* Exercises in day */}
                    <div className="space-y-2">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex flex-wrap items-end gap-2 bg-brand-cream p-3 rounded-lg">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-gray-500">Ejercicio</label>
                            <select value={ex.exerciseId} onChange={e => updateExercise(dayIdx, exIdx, 'exerciseId', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-green-500 outline-none" required>
                              <option value="">Seleccionar...</option>
                              {exercises.map(e => <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>)}
                            </select>
                          </div>
                          <div className="w-16">
                            <label className="text-xs text-gray-500">Series</label>
                            <input type="number" value={ex.sets} onChange={e => updateExercise(dayIdx, exIdx, 'sets', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-green-500 outline-none" min="1" />
                          </div>
                          <div className="w-20">
                            <label className="text-xs text-gray-500">Reps</label>
                            <input type="text" value={ex.reps} onChange={e => updateExercise(dayIdx, exIdx, 'reps', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
                          </div>
                          <div className="w-20">
                            <label className="text-xs text-gray-500">Peso (kg)</label>
                            <input type="number" value={ex.weight} onChange={e => updateExercise(dayIdx, exIdx, 'weight', parseFloat(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-green-500 outline-none" step="0.5" />
                          </div>
                          <div className="w-20">
                            <label className="text-xs text-gray-500">Desc. (s)</label>
                            <input type="number" value={ex.restSeconds} onChange={e => updateExercise(dayIdx, exIdx, 'restSeconds', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-xs text-gray-500">Notas</label>
                            <input type="text" value={ex.notes} onChange={e => updateExercise(dayIdx, exIdx, 'notes', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-green-500 outline-none" />
                          </div>
                          <button type="button" onClick={() => removeExercise(dayIdx, exIdx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => addExerciseToDay(dayIdx)}
                      className="mt-2 flex items-center gap-1 text-sm text-brand-green-500 hover:text-brand-green-600">
                      <Plus size={14} /> Agregar ejercicio
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addDay}
                className="flex items-center gap-2 text-sm text-brand-green-500 border border-brand-green-200 px-4 py-2 rounded-lg hover:bg-brand-green-50">
                <Plus size={16} /> Agregar día
              </button>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={resetBuilder} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-brand-cream">Cancelar</button>
                <button type="submit" className="flex-1 bg-brand-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-brand-green-600 flex items-center justify-center gap-2">
                  <Save size={18} /> {editing ? 'Guardar Cambios' : 'Crear Rutina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
