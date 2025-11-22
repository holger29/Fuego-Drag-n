import React, { useState, useEffect } from 'react';
import type { Feedback, User, Series, Episode } from '../types';
import { db, storage } from '../services/firebase';
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getSeries } from '../services/geminiService';


interface AdminPageProps {
    onLogout: () => void;
}

interface VideoStatus {
    videoUrl?: string;
    status: string;
    fileName?: string;
    storagePath?: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [videoStatuses, setVideoStatuses] = useState<Record<number, VideoStatus>>({});
    const [uploadingEpisodeId, setUploadingEpisodeId] = useState<number | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [loading, setLoading] = useState({ users: true, feedback: true, series: true });
    const [openAccordion, setOpenAccordion] = useState<string | null>('videos');
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

    const fetchSeriesAndVideos = async () => {
        setLoading(prev => ({ ...prev, series: true }));
        const seriesData = await getSeries();
        setSeriesList(seriesData);

        const videoUploadsCol = collection(db, 'video_uploads');
        const videoSnapshot = await getDocs(videoUploadsCol);
        const statuses: Record<number, VideoStatus> = {};
        videoSnapshot.forEach(doc => {
            statuses[parseInt(doc.id)] = doc.data() as VideoStatus;
        });
        setVideoStatuses(statuses);
        setLoading(prev => ({ ...prev, series: false }));
    };

    useEffect(() => {
        fetchUsers();
        fetchFeedback();
        fetchSeriesAndVideos();
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
    
    const handleVideoUpload = async (episodeId: number, file: File) => {
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            alert('Por favor, selecciona un archivo de video válido.');
            return;
        }

        setUploadingEpisodeId(episodeId);
        setUploadProgress(0);
        setUploadError(null);

        try {
            // Create a reference to the location in Firebase Storage
            const storageRef = ref(storage, `videos/${episodeId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error) => {
                    console.error("Error en la subida:", error);
                    setUploadError(`Error al subir: ${error.message}`);
                    setUploadingEpisodeId(null);
                }, 
                async () => {
                    // Upload completed successfully, now we can get the download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save reference to Firestore
                    const videoRef = doc(db, 'video_uploads', String(episodeId));
                    const videoData: VideoStatus = {
                        videoUrl: downloadURL,
                        storagePath: uploadTask.snapshot.ref.fullPath,
                        status: 'ready',
                        fileName: file.name
                    };
                    
                    await setDoc(videoRef, videoData);

                    // Update local state
                    setVideoStatuses(prev => ({
                        ...prev,
                        [episodeId]: videoData
                    }));
                    
                    setUploadingEpisodeId(null);
                    setUploadProgress(0);
                    // alert("¡Video subido y guardado en Firebase Storage exitosamente!");
                }
            );

        } catch (error: any) {
            console.error("Error iniciando la subida:", error);
            setUploadError(`Error al iniciar subida: ${error.message}`);
            setUploadingEpisodeId(null);
        }
    };

    const handleDeleteVideo = async (episodeId: number) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este video? Esta acción borrará el archivo de Firebase Storage.")) return;

        const videoData = videoStatuses[episodeId];
        if (!videoData) return;

        // Set loading state locally for this action if desired, or just rely on async/await
        try {
            // 1. Delete from Storage if path exists
            if (videoData.storagePath) {
                const videoStorageRef = ref(storage, videoData.storagePath);
                try {
                    await deleteObject(videoStorageRef);
                } catch (e: any) {
                    // Ignore error if object not found (already deleted manually)
                    if (e.code !== 'storage/object-not-found') {
                        console.warn("Error deleting object from storage (might already be gone):", e);
                    }
                }
            }

            // 2. Delete document from Firestore
            await deleteDoc(doc(db, 'video_uploads', String(episodeId)));

            // 3. Update local state
            const newStatuses = { ...videoStatuses };
            delete newStatuses[episodeId];
            setVideoStatuses(newStatuses);

            // alert("Video eliminado correctamente.");

        } catch (error: any) {
            console.error("Error eliminando video:", error);
            alert(`Error al eliminar el video: ${error.message}`);
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

    const groupEpisodesBySeason = (episodes: Episode[]) => {
        return episodes.reduce((acc, episode) => {
            (acc[episode.season] = acc[episode.season] || []).push(episode);
            return acc;
        }, {} as Record<number, Episode[]>);
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
                 <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                     <button
                        onClick={() => handleAccordionToggle('videos')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60"
                        aria-expanded={openAccordion === 'videos'}>
                        <h2 className="text-2xl font-semibold font-cinzel">Gestionar Contenido de Video</h2>
                        <i className={`fa-solid fa-chevron-down transform transition-transform ${openAccordion === 'videos' ? 'rotate-180' : ''}`}></i>
                    </button>
                    {openAccordion === 'videos' && (
                        <div className="p-4 border-t border-gray-700">
                             <p className="text-sm text-gray-400 mb-4 bg-gray-900/50 p-2 rounded">
                                <i className="fa-solid fa-circle-info mr-2"></i>
                                Si ves un video como "Disponible" pero la carpeta de Storage está vacía, es un registro antiguo. Puedes usar el botón de <strong>subida (azul)</strong> para reemplazarlo.
                             </p>
                             {uploadError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm text-center mb-4">{uploadError}</p>}
                             {loading.series ? (
                                <div className="text-center p-8"><i className="fa-solid fa-spinner fa-spin text-3xl"></i></div>
                            ) : (
                                <div className="space-y-6">
                                    {seriesList.map(series => (
                                        <div key={series.id}>
                                            <h3 className="text-xl font-bold mb-3 font-cinzel">{series.title}</h3>
                                            <div className="space-y-4">
                                                {Object.entries(groupEpisodesBySeason(series.episodes)).map(([season, episodes]) => (
                                                    <div key={season} className="bg-gray-900/50 p-3 rounded-lg">
                                                        <h4 className="font-semibold text-lg mb-2">Temporada {season}</h4>
                                                        <div className="space-y-2">
                                                            {episodes.map(episode => {
                                                                const status = videoStatuses[episode.id];
                                                                const isUploading = uploadingEpisodeId === episode.id;
                                                                return (
                                                                    <div key={episode.id} className="flex items-center justify-between bg-gray-800/70 p-2 rounded border border-gray-700/50">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-gray-300 font-medium">Episodio {episode.episode}: {episode.title}</span>
                                                                            {status?.fileName && <span className="text-xs text-gray-500"><i className="fa-regular fa-file-video mr-1"></i>{status.fileName}</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            {isUploading ? (
                                                                                <div className="flex flex-col items-end min-w-[150px]">
                                                                                    <div className="flex items-center gap-2 text-xs text-blue-300 mb-1">
                                                                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                                                                        <span>Subiendo {Math.round(uploadProgress)}%...</span>
                                                                                    </div>
                                                                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                                                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    {status ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                             <span className="text-xs font-bold text-green-400 bg-green-900/50 py-1 px-2 rounded-full border border-green-800">
                                                                                                <i className="fa-solid fa-check mr-1"></i>Disponible
                                                                                            </span>
                                                                                            {status.videoUrl && (
                                                                                                <>
                                                                                                    <a 
                                                                                                        href={status.videoUrl} 
                                                                                                        target="_blank" 
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="text-gray-300 hover:text-white transition-colors bg-gray-700 p-2 rounded hover:bg-gray-600"
                                                                                                        title="Ver video"
                                                                                                    >
                                                                                                        <i className="fa-regular fa-eye"></i>
                                                                                                    </a>
                                                                                                    <button 
                                                                                                        onClick={() => handleDeleteVideo(episode.id)}
                                                                                                        className="text-red-400 hover:text-red-200 transition-colors bg-red-900/30 p-2 rounded hover:bg-red-900/50"
                                                                                                        title="Eliminar video"
                                                                                                    >
                                                                                                        <i className="fa-solid fa-trash"></i>
                                                                                                    </button>
                                                                                                </>
                                                                                            )}
                                                                                             <label 
                                                                                                htmlFor={`upload-${episode.id}`} 
                                                                                                className="text-blue-400 hover:text-blue-200 cursor-pointer bg-blue-900/30 p-2 rounded hover:bg-blue-900/50 transition-colors ml-1" 
                                                                                                title="Reemplazar video"
                                                                                            >
                                                                                                <i className="fa-solid fa-upload"></i>
                                                                                            </label>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 py-1 px-2 rounded-full border border-yellow-800">Pendiente</span>
                                                                                            <label htmlFor={`upload-${episode.id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded cursor-pointer transition shadow-lg">
                                                                                                <i className="fa-solid fa-cloud-arrow-up mr-1"></i> Subir
                                                                                            </label>
                                                                                        </>
                                                                                    )}
                                                                                    <input type="file" id={`upload-${episode.id}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && handleVideoUpload(episode.id, e.target.files[0])} />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gray-800/50 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                     <button
                        onClick={() => handleAccordionToggle('users')}
                        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/60"
                        aria-expanded={openAccordion === 'users'}>
                        <h2 className="text-2xl font-semibold font-cinzel">Gestionar Usuarios ({users.length})</h2>
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