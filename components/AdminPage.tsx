import React, { useState, useEffect } from 'react';
import type { Feedback, User } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AdminPageProps {
    onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState({ users: true, feedback: true });
    const [openAccordion, setOpenAccordion] = useState<string | null>('users');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const fetchUsers = async () => {
        setLoading(prev => ({ ...prev, users: true }));
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        const userData = userSnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as User));
        setUsers(userData);
        setLoading(prev => ({ ...prev, users: false }));
    };

    const fetchFeedback = async () => {
        setLoading(prev => ({ ...prev, feedback: true }));
        const feedbackCol = collection(db, 'feedback');
        const q = query(feedbackCol, orderBy('timestamp', 'desc'));
        const feedbackSnapshot = await getDocs(q);
        const feedbackData = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
        setFeedbackList(feedbackData);
        setLoading(prev => ({ ...prev, feedback: false }));
    };

    useEffect(() => {
        fetchUsers();
        fetchFeedback();
    }, []);

    const handleAccordionToggle = (accordionName: string) => {
        setOpenAccordion(prev => (prev === accordionName ? null : accordionName));
    };

    const handleEditUser = (user: User) => {
        setEditingUser({ ...user });
        setNewPassword('');
        setIsModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser || !editingUser.docId) return;

        const updatedData: Partial<User> = {
            name: editingUser.name,
            email: editingUser.email,
            country: editingUser.country,
            city: editingUser.city,
            phoneNumber: editingUser.phoneNumber,
        };

        if (newPassword) {
            if (newPassword.length < 8) {
                alert("La nueva contraseña debe tener al menos 8 caracteres.");
                return;
            }
            updatedData.passwordHash = await hashPassword(newPassword);
        }

        const userRef = doc(db, "users", editingUser.docId);
        await updateDoc(userRef, updatedData);

        // Update local state
        setUsers(users.map(u => u.docId === editingUser.docId ? { ...u, ...updatedData } : u));
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.")) {
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(u => u.docId !== userId));
        }
    };

    const renderUserModal = () => {
        if (!isModalOpen || !editingUser) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                    <div className="p-6 border-b border-gray-700">
                        <h3 className="text-2xl font-bold text-white font-cinzel">Editar Usuario</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Nombre</label>
                            <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">País</label>
                            <input type="text" value={editingUser.country} onChange={e => setEditingUser({ ...editingUser, country: e.target.value })} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300">Ciudad</label>
                            <input type="text" value={editingUser.city} onChange={e => setEditingUser({ ...editingUser, city: e.target.value })} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300">Celular</label>
                            <input type="text" value={editingUser.phoneNumber} onChange={e => setEditingUser({ ...editingUser, phoneNumber: e.target.value })} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Nueva Contraseña (opcional)</label>
                            <input type="password" placeholder="Dejar en blanco para no cambiar" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full bg-gray-700 rounded-md p-2 text-white" />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-900/50 flex justify-end gap-4">
                        <button onClick={() => setIsModalOpen(false)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleUpdateUser} className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            {renderUserModal()}
            <header className="container mx-auto flex items-center justify-between mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider uppercase font-cinzel">
                    Panel de Administrador
                </h1>
                <button onClick={onLogout} className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition">Salir</button>
            </header>
            
            <main className="container mx-auto space-y-4">
                {/* Users CRUD Accordion */}
                <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                     <button
                        onClick={() => handleAccordionToggle('users')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60"
                        aria-expanded={openAccordion === 'users'}>
                        <h2 className="text-2xl font-semibold font-cinzel">Gestionar Usuarios</h2>
                        <i className={`fa-solid fa-chevron-down transform transition-transform ${openAccordion === 'users' ? 'rotate-180' : ''}`}></i>
                    </button>
                    {openAccordion === 'users' && (
                        <div className="p-4 border-t border-gray-700">
                             {loading.users ? (
                                <div className="text-center p-8"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
                            ) : users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">Nombre</th>
                                                <th scope="col" className="px-4 py-3">Email</th>
                                                <th scope="col" className="px-4 py-3">País</th>
                                                <th scope="col" className="px-4 py-3">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.docId} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 font-medium whitespace-nowrap">{user.name}</td>
                                                    <td className="px-4 py-3">{user.email}</td>
                                                    <td className="px-4 py-3">{user.country}</td>
                                                    <td className="px-4 py-3 flex gap-2">
                                                        <button onClick={() => handleEditUser(user)} className="text-blue-400 hover:text-blue-300" title="Editar"><i className="fas fa-pencil-alt"></i></button>
                                                        <button onClick={() => handleDeleteUser(user.docId!)} className="text-red-500 hover:text-red-400" title="Borrar"><i className="fas fa-trash"></i></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center p-8">No hay usuarios registrados.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Feedback Accordion */}
                <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => handleAccordionToggle('feedback')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60"
                        aria-expanded={openAccordion === 'feedback'}>
                        <h2 className="text-2xl font-semibold font-cinzel">Comentarios de Usuarios</h2>
                        <i className={`fa-solid fa-chevron-down transform transition-transform ${openAccordion === 'feedback' ? 'rotate-180' : ''}`}></i>
                    </button>
                    {openAccordion === 'feedback' && (
                         <div className="p-4 border-t border-gray-700">
                            {loading.feedback ? (
                                <div className="text-center p-8"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
                            ) : feedbackList.length > 0 ? (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {feedbackList.map(fb => (
                                        <div key={fb.id} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-lg">{fb.userName}</p>
                                                    <p className="text-sm text-gray-400">{fb.userEmail}</p>
                                                </div>
                                                <p className="text-xs text-gray-500">{fb.timestamp.toDate().toLocaleString()}</p>
                                            </div>
                                            <p className="text-gray-300 whitespace-pre-wrap">{fb.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center p-8">No hay comentarios para mostrar.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
