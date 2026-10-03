import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { asset } from "../../utils/asset";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="relative items-center hidden w-full h-full lg:w-1/2 lg:grid overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${asset("images/portada.jpg")}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-brand-900/80 to-brand-800/70" />
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-8">
            <Link to="/" className="block mb-6">
              <img
                width={200}
                height={60}
                src={asset("images/logo/logo.png")}
                alt="Embid Distribuidora S.A.C"
                className="rounded-xl shadow-2xl"
              />
            </Link>
            <div className="text-center max-w-sm">
              <h2 className="text-2xl font-bold text-white mb-3">
                Embid Distribuidora S.A.C
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Sistema de Reportes de Rechazos
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              <span className="text-xs text-gray-400">En línea</span>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
