import { useState, useEffect, useRef } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  role: "admin" | "user";
  status: "activo" | "inactivo";
}

interface UserFormProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

import { API_URL } from "../../config/api";

export default function UserForm({ user, onClose, onSave }: UserFormProps) {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [status, setStatus] = useState<"activo" | "inactivo">("activo");
  const [avatar, setAvatar] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFname(user.fname);
      setLname(user.lname);
      setEmail(user.email);
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setRole(user.role);
      setStatus(user.status);
      setAvatar(user.avatar || "");
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatar || null;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let avatarUrl = avatar || null;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) avatarUrl = uploaded;
      }

      const body: Record<string, string | null> = {
        fname,
        lname,
        email,
        phone: phone || null,
        bio: bio || null,
        role,
        status,
        avatar: avatarUrl,
      };

      if (!user && password) {
        body.password = password;
      }

      const url = user ? `${API_URL}/users/${user.id}` : `${API_URL}/users`;
      const method = user ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(user ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setError(data.message || "Error al guardar usuario");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl mx-4 mb-10 bg-white rounded-2xl shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {user ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-error-500 bg-error-500/10 border border-error-500/20 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm text-success-500 bg-success-500/10 border border-success-500/20 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-brand-500 rounded-full text-white hover:bg-brand-600 shadow-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto de perfil</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG. Máx 2MB</p>
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Nombre *</Label>
              <Input
                type="text"
                placeholder="Nombre"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
              />
            </div>
            <div>
              <Label>Apellido *</Label>
              <Input
                type="text"
                placeholder="Apellido"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <Label>Correo electrónico *</Label>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          {!user && (
            <div className="mb-3">
              <Label>Contraseña *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {/* Phone & Role Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Teléfono</Label>
              <Input
                type="text"
                placeholder="+54 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Rol</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "user")}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* Status & Bio Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Estado</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "activo" | "inactivo")}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <Label>Biografía</Label>
              <textarea
                placeholder="Breve descripción..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={1}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!success} className="flex-1">
              {isLoading ? "Guardando..." : success ? "¡Listo!" : user ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
