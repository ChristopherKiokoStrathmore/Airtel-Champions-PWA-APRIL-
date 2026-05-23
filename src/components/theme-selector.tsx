import React from 'react';
import { useTheme, themes, type Theme } from './theme-provider';
import { Check, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  onClose: () => void;
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { theme: currentTheme, setThemeById } = useTheme();

  const handleSelect = (t: Theme) => {
    setThemeById(t.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-in fade-in"
        style={{
          backgroundColor: currentTheme.colors.bgCard,
          boxShadow: `0 25px 60px ${currentTheme.colors.shadowColor}, 0 0 0 1px ${currentTheme.colors.border}`,
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{ background: currentTheme.colors.headerBg }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)', filter: 'blur(20px)' }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 30%)', filter: 'blur(15px)' }} />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <Sparkles className="w-5 h-5" style={{ color: currentTheme.colors.headerText }} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight" style={{ color: currentTheme.colors.headerText }}>
                  Choose Your Theme
                </h2>
                <p className="text-xs opacity-80" style={{ color: currentTheme.colors.headerText }}>
                  Designed with obsessive attention to detail
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke={currentTheme.colors.headerText} viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => {
              const isActive = t.id === currentTheme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className="group relative rounded-2xl overflow-hidden text-left transition-all duration-300"
                  style={{
                    border: `2px solid ${isActive ? t.colors.primary : currentTheme.colors.border}`,
                    backgroundColor: isActive ? t.colors.primaryLight : currentTheme.colors.bgCard,
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isActive ? `0 8px 24px ${t.colors.shadowColor}` : 'none',
                  }}
                >
                  {/* Preview strip */}
                  <div
                    className="h-16 relative overflow-hidden"
                    style={{ background: t.colors.headerBg }}
                  >
                    {/* Mini phone mockup */}
                    <div className="absolute inset-x-3 top-2 bottom-0">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                        <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                      </div>
                      <div className="flex gap-1">
                        <div className="h-4 rounded flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                        <div className="h-4 rounded flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      </div>
                    </div>
                    
                    {/* Active check */}
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                        <Check className="w-3 h-3" style={{ color: t.colors.primary }} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-xs font-bold tracking-tight" style={{ color: isActive ? t.colors.primary : currentTheme.colors.textPrimary }}>
                        {t.name}
                      </span>
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: currentTheme.colors.textMuted }}>
                      {t.description}
                    </p>

                    {/* Color dots preview */}
                    <div className="flex gap-1 mt-2">
                      {[t.colors.primary, t.colors.accent, t.colors.success, t.colors.bgPage].map((color, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full"
                          style={{
                            backgroundColor: color,
                            border: `1px solid ${currentTheme.colors.border}`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center mt-4 text-[11px]" style={{ color: currentTheme.colors.textMuted }}>
            "Design is not just what it looks like. Design is how it works." — Steve Jobs
          </p>
        </div>
      </div>
    </div>
  );
}
