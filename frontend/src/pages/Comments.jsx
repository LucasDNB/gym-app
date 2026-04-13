import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, Check, CheckCheck } from 'lucide-react';

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensajes</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex" style={{ height: '70vh' }}>
        {/* Contact list */}
        <div className="w-64 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
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
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-indigo-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role === 'trainer' ? 'Entrenador' : contact.role === 'admin' ? 'Admin' : 'Usuario'}</p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
                  )}
                </div>
              </button>
            );
          })}
          {contacts.length === 0 && <p className="text-sm text-gray-400 p-4">Sin contactos</p>}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <p className="font-medium text-gray-900">{selectedContact.name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredComments.map(c => (
                  <div key={c.id} className={`flex ${c.fromUserId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${c.fromUserId === user.id
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                      <p className="text-sm">{c.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${c.fromUserId === user.id ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${c.fromUserId === user.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(c.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {c.fromUserId === user.id && (c.read ? <CheckCheck size={12} className="text-indigo-200" /> : <Check size={12} className="text-indigo-200" />)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>

              <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 flex gap-2">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Escribir mensaje..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <button type="submit" disabled={!message.trim()}
                  className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors">
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
