'use client';

import React, { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
      <div className="relative z-10 space-y-4">
        <span className="bg-white/20 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Boletim Diário
        </span>
        <h3 className="text-xl md:text-2xl font-extrabold leading-tight">
          Receba Notificações de Editais no seu E-mail
        </h3>
        <p className="text-blue-100 text-xs md:text-sm leading-relaxed">
          Cadastre-se gratuitamente para receber alertas de novos concursos abertos, gabaritos e convocações.
        </p>

        {subscribed ? (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-100 p-4 rounded-xl text-xs md:text-sm font-semibold">
            ✓ Inscrição confirmada! Fique atento à sua caixa de entrada.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail..."
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="w-full py-3 bg-white text-blue-900 font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-md"
            >
              Quero Receber Alertas
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
