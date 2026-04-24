import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, Check, CheckCheck, ArrowLeft } from 'lucide-react';

export default function Comments() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEnd = useRef(null);

  useEffect(() => { loadComments(); loadContacts(); }, []);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments, selectedContact]);

  const loadComments = async () => {
    const res = await api.get('/comments');
    setComments(res.data);
  };

  const loadContacts = async () => {
    if (user.role === 'user') {
      // User sees their trainer
      const me = await api.get('/auth/me');
      if (me.data.trainer) setContacts([me.data.trainer]);
    } else {
      // Trainer/admin sees their clients
      const res = await api.get('/auth/users');
      setContacts(res.data.filter(u => u.id !== user.id));
    }
  };

  const filteredComments = selectedContact
    ? comments.filter(c =>
      (c.fromUserId === user.id && c.toUserId === selectedContact.id) ||
      (c.fromUserId === selectedContact.id && c.toUserId === user.id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact) return;
    await api.post('/comments', { message, toUserId: selectedContact.id });
    setMessage('');
    loadComments();
  };

  const markAsRead = async (commentId) => {
    await api.patch(`/comments/${commentId}/read`);
    loadComments();
  };

  const getUnreadCount = (contactId) => {
    return comments.filter(c => c.fromUserId === contactId && c.toUserId === user.id && !c.read).length;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-green-700 mb-6">Mensajes</h1>

      <div className="bg-white rounded-xl shadow-sm border border-brand-cream-dark overflow-hidden flex h-[calc(100dvh-13rem)] sm:h-[70vh]">
        {/* Contact list */}
        <div className={`w-full sm:w-64 border-r border-brand-cream-dark flex-shrink-0 overflow-y-auto ${selectedContact ? 'hidden sm:block' : 'block'}`}>
          <div className="p-3 border-b border-brand-cream-dark">
            <p className="text-sm font-medium text-gray-500">Contactos</p>
          </div>
          {contacts.map(contact => {
            const unread = getUnreadCount(contact.id);
            return (
              <button key={contact.id} onClick={() => {
                setSelectedContact(contact);
                comments.filter(c => c.fromUserId === contact.id && c.toUserId === user.id && !c.read)
                  .forEach(c => markAsRead(c.id));
              }}
                className={`w-full text-left px-4 py-3 border-b border-brand-cream-dark hover:bg-brand-cream transition-colors ${selectedContact?.id === contact.id ? 'bg-brand-pink-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-brand-green-700 text-sm">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role === 'trainer' ? 'Entrenador' : contact.role === 'admin' ? 'Admin' : 'Usuario'}</p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-brand-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
                  )}
                </div>
              </button>
            );
          })}
          {contacts.length === 0 && <p className="text-sm text-gray-400 p-4">Sin contactos</p>}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex-col ${selectedContact ? 'flex' : 'hidden sm:flex'}`}>
          {selectedContact ? (
            <>
              <div className="px-4 py-3 border-b border-brand-cream-dark bg-brand-cream flex items-center gap-2">
                <button onClick={() => setSelectedContact(null)} className="sm:hidden p-1 -ml-1 text-brand-green-600" aria-label="Volver">
                  <ArrowLeft size={20} />
                </button>
                <p className="font-medium text-brand-green-700">{selectedContact.name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredComments.map(c => (
                  <div key={c.id} className={`flex ${c.fromUserId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${c.fromUserId === user.id
                      ? 'bg-brand-green-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-brand-green-700 rounded-bl-sm'}`}>
                      <p className="text-sm">{c.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${c.fromUserId === user.id ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${c.fromUserId === user.id ? 'text-brand-green-200' : 'text-gray-400'}`}>
                          {new Date(c.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.fromUserId === user.id && (c.read ? <CheckCheck size={12} className="text-brand-green-200" /> : <Check size={12} className="text-brand-green-200" />)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-brand-cream-dark flex gap-2">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Escribir mensaje..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-green-500 outline-none text-sm" />
                <button type="submit" disabled={!message.trim()}
                  className="bg-brand-green-500 text-white p-2.5 rounded-full hover:bg-brand-green-600 disabled:opacity-50 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Seleccioná un contacto para chatear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
