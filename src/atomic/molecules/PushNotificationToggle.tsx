import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Point } from "@/db/schema";
import { calculateTargetWorkTime } from "@/services/pushService";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, BellOff, BellRing, Clock, Loader2, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";

interface PushNotificationToggleProps {
  todayPoints?: Point[];
}

export function PushNotificationToggle({
  todayPoints,
}: PushNotificationToggleProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    targetMinutes,
    updateTargetMinutes,
    enablePush,
    disablePush,
  } = usePushNotifications(todayPoints);

  const [isOpen, setIsOpen] = useState(false);
  const [tempHours, setTempHours] = useState(() => Math.floor(targetMinutes / 60));
  const [tempMinutes, setTempMinutes] = useState(() => targetMinutes % 60);
  const [feedback, setFeedback] = useState<string | null>(null);

  const estimatedEndTime = useMemo(() => {
    if (!todayPoints || todayPoints.length === 0) return null;
    const currentTotalMin = tempHours * 60 + tempMinutes;
    const targetIso = calculateTargetWorkTime(todayPoints, currentTotalMin);
    if (!targetIso) return null;
    return format(new Date(targetIso), "HH:mm");
  }, [todayPoints, tempHours, tempMinutes]);

  const handleOpen = () => {
    setTempHours(Math.floor(targetMinutes / 60));
    setTempMinutes(targetMinutes % 60);
    setIsOpen(true);
  };

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await disablePush();
        setFeedback("Notificações desativadas.");
      } else {
        await enablePush();
        setFeedback("Notificações ativadas com sucesso!");
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar notificações";
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSaveTarget = () => {
    const total = Math.max(1, tempHours * 60 + tempMinutes);
    updateTargetMinutes(total);
    setFeedback(`Meta atualizada para ${tempHours}h${tempMinutes > 0 ? ` ${tempMinutes}m` : ""}!`);
    setTimeout(() => {
      setFeedback(null);
      setIsOpen(false);
    }, 1200);
  };

  const quickPresets = [
    { label: "4h", hours: 4, minutes: 0 },
    { label: "6h", hours: 6, minutes: 0 },
    { label: "8h", hours: 8, minutes: 0 },
    { label: "8h48m", hours: 8, minutes: 48 },
  ];

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isLoading}
        className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center relative ${
          isSubscribed
            ? "bg-violet-600/20 border-violet-500/50 text-violet-400 hover:bg-violet-600/30"
            : permission === "denied"
              ? "bg-zinc-900/90 border-rose-800/60 text-rose-400 opacity-60"
              : "bg-zinc-900/90 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
        title="Configurar Alerta e Meta de Expediente"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        ) : isSubscribed ? (
          <BellRing className="w-5 h-5 text-violet-400" />
        ) : permission === "denied" ? (
          <BellOff className="w-5 h-5 text-rose-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl focus:outline-none flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <Dialog.Title className="font-semibold text-sm text-zinc-100">
                    Alerta de Meta Diária
                  </Dialog.Title>
                  <p className="text-[11px] text-zinc-400">
                    Expediente e Notificações Push
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Switch de Ativação */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">
                  Notificações de Sistema
                </span>
                <span className="text-[11px] text-zinc-400">
                  {!isSupported
                    ? "Indisponível neste contexto"
                    : isSubscribed
                      ? "Ativas (mesmo com app fechado)"
                      : "Desativadas"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSubscription}
                disabled={!isSupported || isLoading || permission === "denied"}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !isSupported
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : isSubscribed
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/30"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  "Desativar"
                ) : (
                  "Ativar"
                )}
              </button>
            </div>

            {!isSupported && (
              <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                Notificações Push exigem conexão segura (HTTPS). No iOS, funcionam apenas quando acessado via HTTPS e adicionado à Tela de Início (iOS 16.4+).
              </p>
            )}

            {isSupported && permission === "denied" && (
              <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                Permissão de notificações bloqueada no navegador. Habilite nas configurações do site.
              </p>
            )}

            {/* Definir Meta de Horas */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Meta de Expediente Diário
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-400 font-medium">Horas</span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={tempHours}
                    onChange={(e) => setTempHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="p-2.5 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-lg focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-400 font-medium">Minutos</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={tempMinutes}
                    onChange={(e) => setTempMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="p-2.5 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-lg focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 justify-center mt-1">
                {quickPresets.map((p) => {
                  const isSelected = tempHours === p.hours && tempMinutes === p.minutes;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setTempHours(p.hours);
                        setTempMinutes(p.minutes);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-violet-600/30 border-violet-500/60 text-violet-300 font-bold"
                          : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Previsão de Término Hoje */}
            {estimatedEndTime && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Previsão de meta hoje às <strong className="font-mono text-sm">{estimatedEndTime}</strong>
                </span>
              </div>
            )}

            {feedback && (
              <div className="text-center text-xs font-medium text-violet-300 bg-violet-500/10 py-2 rounded-xl border border-violet-500/20 animate-in fade-in">
                {feedback}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
              >
                Salvar Meta
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
