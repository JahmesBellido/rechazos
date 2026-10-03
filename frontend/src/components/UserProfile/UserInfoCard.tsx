import { useAuth } from "../../context/AuthContext";

export default function UserInfoCard() {
  const { user } = useAuth();

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información Personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nombre
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.fname}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Apellido
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.lname}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Correo electrónico
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Teléfono
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.phone || "No registrado"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Biografía
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.bio || "Sin biografía"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Rol
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
