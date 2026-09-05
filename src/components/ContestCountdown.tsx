'use client';

import React, { useEffect, useState } from 'react';

interface ContestCountdownProps {
  enrollmentEndDate?: string;
  examDate?: string;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(targetDateStr?: string): TimeRemaining | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export default function ContestCountdown({
  enrollmentEndDate,
  examDate,
  className = '',
}: ContestCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [enrollmentTime, setEnrollmentTime] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setEnrollmentTime(calculateTimeRemaining(enrollmentEndDate));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [enrollmentEndDate]);

  if (!mounted || !enrollmentTime || enrollmentTime.isExpired) {
    return null;
  }

  return (
    <div
      className={`my-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm ${className}`}
      aria-label="Contagem regressiva para encerramento das inscrições"
    >
      <div className="flex items-center gap-2.5 text-center sm:text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Atenção ao Prazo
          </p>
          <p className="text-sm font-semibold">
            Inscrições encerram em breve:
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-center" aria-live="polite">
        <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs min-w-[52px]">
          <span className="block text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {enrollmentTime.days}
          </span>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            dias
          </span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs min-w-[48px]">
          <span className="block text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {String(enrollmentTime.hours).padStart(2, '0')}
          </span>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            horas
          </span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs min-w-[48px]">
          <span className="block text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {String(enrollmentTime.minutes).padStart(2, '0')}
          </span>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            min
          </span>
        </div>
        <span className="text-amber-500 font-bold">:</span>
        <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs min-w-[48px]">
          <span className="block text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {String(enrollmentTime.seconds).padStart(2, '0')}
          </span>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
            seg
          </span>
        </div>
      </div>
    </div>
  );
}
