import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Point } from "@/db/schema";
import type { AlertType, CustomAlert } from "@/services/pushService";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

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
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    updateAlert,
    enablePush,
    disablePush,
  } = usePushNotifications(todayPoints);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Formulário de aviso (novo ou edição)
  const [formType, setFormType] = useState<AlertType>("exact_time");
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTime, setFormTime] = useState("12:00");
  const [formHours, setFormHours] = useState(8);
  const [formMinutes, setFormMinutes] = useState(0);
  const [formOnlyIfWorking, setFormOnlyIfWorking] = useState(true);

  const showTemporaryFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleOpenAddForm = () => {
    setEditingAlertId(null);
    setFormType("exact_time");
    setFormLabel("");
    setFormDescription("");
    setFormTime("12:00");
    setFormHours(8);
    setFormMinutes(0);
    setFormOnlyIfWorking(true);
    setShowAddForm(true);
  };

  const handleStartEdit = (alert: CustomAlert) => {
    setEditingAlertId(alert.id);
    setFormType(alert.type);
    setFormLabel(alert.label);
    setFormDescription(alert.description || "");
    if (alert.type === "exact_time") {
      setFormTime(alert.time || "12:00");
    } else {
      const dur = alert.durationMinutes || 480;
      setFormHours(Math.floor(dur / 60));
      setFormMinutes(dur % 60);
    }
    setFormOnlyIfWorking(alert.onlyIfWorking);
    setShowAddForm(true);
  };

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await disablePush();
        showTemporaryFeedback("Notificações desativadas.");
      } else {
        await enablePush();
        showTemporaryFeedback("Notificações ativadas com sucesso!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar notificações";
      showTemporaryFeedback(msg);
    }
  };

  const handleSaveAlert = () => {
    const label =
      formLabel.trim() ||
      (formType === "exact_time"
        ? `Aviso às ${formTime}`
        : `Meta de ${formHours}h${formMinutes > 0 ? ` ${formMinutes}m` : ""}`);
    const description = formDescription.trim() || undefined;

    if (editingAlertId) {
      const existing = alerts.find((a) => a.id === editingAlertId);
      if (existing) {
        updateAlert({
          ...existing,
          type: formType,
          label,
          description,
          time: formType === "exact_time" ? formTime : undefined,
          durationMinutes:
            formType === "work_duration"
              ? Math.max(1, formHours * 60 + formMinutes)
              : undefined,
          onlyIfWorking: formType === "exact_time" ? formOnlyIfWorking : true,
        });
        showTemporaryFeedback(`Aviso "${label}" atualizado!`);
      }
    } else {
      if (formType === "exact_time") {
        addAlert({
          type: "exact_time",
          label,
          description,
          time: formTime,
          onlyIfWorking: formOnlyIfWorking,
          enabled: true,
        });
      } else {
        const totalMinutes = Math.max(1, formHours * 60 + formMinutes);
        addAlert({
          type: "work_duration",
          label,
          description,
          durationMinutes: totalMinutes,
          onlyIfWorking: true,
          enabled: true,
        });
      }
      showTemporaryFeedback(`Aviso "${label}" adicionado!`);
    }

    setShowAddForm(false);
    setEditingAlertId(null);
  };

  const quickPresets = [
    { label: "Almoço", type: "exact_time" as const, time: "12:00", onlyIfWorking: true },
    { label: "Voltar do Almoço", type: "exact_time" as const, time: "13:00", onlyIfWorking: false },
    { label: "Pausa / Lanche", type: "exact_time" as const, time: "15:30", onlyIfWorking: true },
    { label: "Fim do Expediente", type: "exact_time" as const, time: "18:00", onlyIfWorking: true },
    { label: "Meta de 8h", type: "work_duration" as const, durationMinutes: 480, onlyIfWorking: true },
    { label: "Meta de 8h48m", type: "work_duration" as const, durationMinutes: 528, onlyIfWorking: true },
  ];

  const handleAddPreset = (preset: typeof quickPresets[0]) => {
    addAlert({
      type: preset.type,
      label: preset.label,
      time: preset.time,
      durationMinutes: preset.durationMinutes,
      onlyIfWorking: preset.onlyIfWorking,
      enabled: true,
    });
    showTemporaryFeedback(`Aviso "${preset.label}" adicionado!`);
  };

  const activeAlertsCount = alerts.filter((a) => a.enabled).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center relative ${
          isSubscribed
            ? "bg-violet-600/20 border-violet-500/50 text-violet-400 hover:bg-violet-600/30"
            : permission === "denied"
              ? "bg-zinc-900/90 border-rose-800/60 text-rose-400 opacity-60"
              : "bg-zinc-900/90 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
        title="Gerenciar Avisos e Notificações"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        ) : isSubscribed ? (
          <>
            <BellRing className="w-5 h-5 text-violet-400" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {activeAlertsCount}
              </span>
            )}
          </>
        ) : permission === "denied" ? (
          <BellOff className="w-5 h-5 text-rose-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-2xl focus:outline-none flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <Dialog.Title className="font-semibold text-sm text-zinc-100">
                    Avisos & Notificações
                  </Dialog.Title>
                  <p className="text-[11px] text-zinc-400">
                    Lembretes automáticos durante o dia
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Switch de Ativação do Push */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">
                  Notificações do Sistema
                </span>
                <span className="text-[11px] text-zinc-400">
                  {!isSupported
                    ? "Indisponível neste contexto"
                    : isSubscribed
                      ? `${activeAlertsCount} aviso(s) ativo(s)`
                      : "Desativadas no dispositivo"}
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
                Notificações Push exigem conexão segura (HTTPS). No iOS, funcionam quando adicionado à Tela de Início (iOS 16.4+).
              </p>
            )}

            {isSupported && permission === "denied" && (
              <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                Permissão bloqueada no navegador. Habilite nas configurações do site para receber avisos.
              </p>
            )}

            {/* Lista de Avisos Configurados */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Avisos de Hoje ({alerts.length})
                </span>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-violet-500/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Aviso</span>
                  </button>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="text-center py-4 px-3 text-zinc-500 text-xs bg-zinc-950/40 rounded-2xl border border-dashed border-zinc-800 leading-relaxed">
                  Sem avisos hoje. O aviso de meta é criado automaticamente ao bater a 1ª entrada do dia.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-0.5">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        alert.enabled
                          ? "bg-zinc-950/70 border-zinc-800/80 text-zinc-200"
                          : "bg-zinc-950/30 border-zinc-800/40 text-zinc-500 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            alert.type === "work_duration"
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-violet-500/20 text-violet-400"
                          }`}
                        >
                          {alert.type === "work_duration" ? (
                            <Target className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate">
                            {alert.label}
                          </span>
                          {alert.description && (
                            <span className="text-[11px] text-zinc-300 truncate">
                              {alert.description}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {alert.type === "exact_time"
                              ? `Às ${alert.time}`
                              : `Após ${Math.floor((alert.durationMinutes || 0) / 60)}h${
                                  (alert.durationMinutes || 0) % 60 > 0
                                    ? ` ${(alert.durationMinutes || 0) % 60}m`
                                    : ""
                                }`}
                            {alert.onlyIfWorking ? " • Se trabalhando" : " • Único"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleAlert(alert.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            alert.enabled
                              ? "bg-violet-600/30 text-violet-300 border border-violet-500/50"
                              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                          title={alert.enabled ? "Desativar este aviso" : "Ativar este aviso"}
                        >
                          {alert.enabled ? "Ativo" : "Off"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(alert)}
                          className="p-1 text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Editar aviso"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAlert(alert.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Excluir aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário de Adicionar / Editar Aviso */}
            {showAddForm ? (
              <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-zinc-950/90 border border-violet-500/30 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-300">
                    {editingAlertId ? "Editar Aviso" : "Novo Aviso"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingAlertId(null);
                    }}
                    className="text-zinc-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tipo de Aviso */}
                <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setFormType("exact_time")}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      formType === "exact_time"
                        ? "bg-violet-600 text-white font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Horário Específico
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("work_duration")}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      formType === "work_duration"
                        ? "bg-violet-600 text-white font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Meta de Horas
                  </button>
                </div>

                {/* Nome do Aviso */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-400 font-medium">
                    Título do Aviso / Notificação
                  </label>
                  <input
                    type="text"
                    placeholder={formType === "exact_time" ? "Ex: Almoço, Reunião, Pausa" : "Ex: Meta de 8h"}
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="p-2 border border-zinc-700 rounded-xl bg-zinc-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Descrição do Aviso (Opcional) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-400 font-medium">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Não esquecer de registrar a saída"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="p-2 border border-zinc-700 rounded-xl bg-zinc-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Horário ou Duração */}
                {formType === "exact_time" ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-medium">
                      Horário do Alerta
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="p-2 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-base focus:outline-none focus:border-violet-500 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-zinc-400 font-medium">
                        Horas
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={formHours}
                        onChange={(e) => setFormHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="p-2 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-base focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-zinc-400 font-medium">
                        Minutos
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={formMinutes}
                        onChange={(e) => setFormMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="p-2 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-base focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* Apenas se estiver trabalhando */}
                {formType === "exact_time" && (
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formOnlyIfWorking}
                      onChange={(e) => setFormOnlyIfWorking(e.target.checked)}
                      className="rounded accent-violet-600 cursor-pointer"
                    />
                    <span>Notificar somente se o ponto estiver aberto hoje</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleSaveAlert}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAlertId ? "Salvar Alterações" : "Adicionar Aviso"}</span>
                </button>
              </div>
            ) : (
              /* Presets rápidos */
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                  Adicionar Rapido:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-violet-500/50 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-violet-400" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {feedback && (
              <div className="text-center text-xs font-medium text-violet-300 bg-violet-500/10 py-2 rounded-xl border border-violet-500/20 animate-in fade-in">
                {feedback}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}


