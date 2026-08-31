import React, { useState } from 'react';
import { authenticateUser, UserSession } from '../../domain/services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const session = authenticateUser(username, password);
    if (session) {
      onLoginSuccess(session);
    } else {
      setErrorMessage('Credenciales inválidas. Por favor verifique el usuario y la contraseña.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full font-sans text-white select-none relative overflow-hidden" style={{ background: 'linear-gradient(to right, #40245E, #6B4E8A)' }}>
      {/* Top Header */}
      <header className="w-full flex justify-between items-start p-6 md:p-8 absolute top-0 left-0 right-0 z-10">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-wide text-white">VETSOFT</h1>
          <p className="text-sm opacity-80 mt-1">Sistema de Gestión para Clínicas Veterinarias</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 my-auto z-10 pt-24 pb-20">
        {/* Login Card */}
        <div className="bg-white text-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-[500px]">
          {/* Card Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-[#5C3C7B] rounded-xl flex items-center justify-center mb-4 shadow-md overflow-hidden p-2 text-white">
              <span className="material-symbols-outlined text-[42px]" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            </div>
            <h2 className="text-2xl font-bold text-[#5C3C7B]">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500 mt-1">Ingrese sus credenciales corporativas para acceder</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2" htmlFor="username">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Administrador"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-lg text-gray-900 bg-[#F5EFF9] focus:outline-none focus:ring-2 focus:ring-[#9A7DB8] focus:border-transparent sm:text-sm font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-transparent rounded-lg text-gray-900 bg-[#F5EFF9] focus:outline-none focus:ring-2 focus:ring-[#9A7DB8] focus:border-transparent sm:text-sm font-medium tracking-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#5C3C7B] transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#9A7DB8] hover:bg-[#8362A5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9A7DB8] transition-colors duration-200 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex justify-between items-center p-6 md:p-8 absolute bottom-0 left-0 right-0 text-xs opacity-70 pointer-events-none">
        <p className="">VETSOFT © 2026 • Todos los derechos reservados</p>
        <p className="absolute left-1/2 -translate-x-1/2 font-semibold">APSOL 2026</p>
        <p className="hidden sm:inline">Sistema Seguro SSL • Control de Accesos</p>
      </footer>
    </div>
  );
};
