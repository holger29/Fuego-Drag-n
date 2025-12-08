import React, { useState } from "react";
//import { useState } from "react";
import { storage, db } from "../services/firebase"; // Importamos tu configuración lista
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const VideoUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return alert("¡Falta el video o el título, jinete!");

    setLoading(true);

    // 1. Subir el archivo al Storage (la nube de archivos)
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Barra de progreso
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
      },
      (error) => {
        console.error(error);
        alert("Error al subir: " + error.message);
        setLoading(false);
      },
      () => {
        // 2. Obtener la URL y guardar los datos en Firestore (Base de Datos)
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          try {
            await addDoc(collection(db, "video_uploads"), { // Usamos tu colección existente
              titulo: title,
              descripcion: description,
              videoUrl: downloadURL,
              fecha: serverTimestamp(),
            });
            
            alert("¡Saga subida exitosamente a Fuego Dragón! 🔥");
            setLoading(false);
            setProgress(0);
            setTitle("");
            setDescription("");
            setFile(null);
          } catch (e) {
            console.error("Error guardando datos: ", e);
            setLoading(false);
          }
        });
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-slate-900 border-2 border-red-800 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
      <h2 className="text-2xl font-bold text-red-500 mb-6 text-center font-serif">
        Subir Nueva Saga
      </h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Título del Video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-slate-800 text-white border border-slate-600 rounded focus:border-red-500 outline-none"
        />
        
        <textarea
          placeholder="Descripción corta"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 bg-slate-800 text-white border border-slate-600 rounded focus:border-red-500 outline-none"
        />

        <input
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer"
        />

        {progress > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
            <p className="text-center text-xs text-gray-400 mt-1">{progress}% completado</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Subiendo a la nube..." : "PUBLICAR 🔥"}
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;