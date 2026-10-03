import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import UserForm from "./UserForm";

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
  created_at: string;
}

import { API_URL } from "../../config/api";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = async (query?: string) => {
    try {
      const url = query
        ? `${API_URL}/users?search=${encodeURIComponent(query)}`
        : `${API_URL}/users`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/status`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map((u) => (u.id === user.id ? data.user : u)));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers(search);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  return (
    <>
      <PageMeta
        title="Gestión de Usuarios | Embid Distribuidora S.A.C"
        description="Administrar usuarios del sistema"
      />
      <PageBreadcrumb pageTitle="Usuarios" />
      <div className="space-y-6">
        <ComponentCard title="Lista de Usuarios">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg
                  className="fill-gray-500 dark:fill-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                    fill=""
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <Button
              onClick={() => {
                setEditingUser(null);
                setShowForm(true);
              }}
              size="sm"
            >
              + Agregar Usuario
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Usuario
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Email
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Rol
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Creado
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                {user.avatar ? (
                                  <img
                                    width={40}
                                    height={40}
                                    src={user.avatar}
                                    alt={`${user.fname} ${user.lname}`}
                                  />
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {user.fname} {user.lname}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {user.email}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <Badge
                              size="sm"
                              color={user.role === "admin" ? "success" : "primary"}
                            >
                              {user.role === "admin" ? "Admin" : "Usuario"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={togglingId === user.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                user.status === "activo"
                                  ? "bg-success-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              title={user.status === "activo" ? "Desactivar" : "Activar"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                                  user.status === "activo"
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-1.5 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {deleteConfirm === user.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="px-2 py-1 text-xs text-white bg-error-500 rounded hover:bg-error-600"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="p-1.5 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </>
  );
}
