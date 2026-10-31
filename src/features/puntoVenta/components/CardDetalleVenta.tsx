import React, { useState } from "react";
import { DetalleVentaRow } from "@/shared/types/db/tablas";
import { Icon } from "@iconify/react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useForm } from "react-hook-form";
import { useEditarNotaDetalleVentaMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";
import { useEliminarDetalleVentaMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";
import { useEditarPrioridadDetalleVentaMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";
import { toast } from "sonner";

type Props = {
  dataDetalleVenta?: DetalleVentaRow[];
  isLoadingDetalleVenta: boolean;
  simbolo?: string;
};

type NotaForm = {
  nota: string;
};

export const CardDetalleVenta = ({
  dataDetalleVenta,
  isLoadingDetalleVenta,
  simbolo = "S/",
}: Props) => {
  const editarNotaMutate = useEditarNotaDetalleVentaMutate();
  const eliminarDetalleMutate = useEliminarDetalleVentaMutate();
  const editarPrioridadMutate = useEditarPrioridadDetalleVentaMutate();

  const [editId, setEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingPrioridadId, setTogglingPrioridadId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NotaForm>({
    defaultValues: { nota: "" },
    mode: "onChange",
  });

  const notaValue = watch("nota") ?? "";
  const isSavingNota = editarNotaMutate.isPending || isSubmitting;

  const normalizeNota = (nota?: string | null) => (nota ?? "").trim();
  const isEmptyNota = (nota?: string | null) => {
    const n = normalizeNota(nota);
    return n === "" || n === "-" || n === "–";
  };

  const openAdd = (it: DetalleVentaRow) => {
    setEditId(it.id);
    reset({ nota: "" });
  };

  const openEdit = (it: DetalleVentaRow) => {
    setEditId(it.id);
    reset({ nota: isEmptyNota(it.nota) ? "" : normalizeNota(it.nota) });
  };

  const closeEdit = () => {
    setEditId(null);
    reset({ nota: "" });
  };

  const onSave = (id: number) =>
    handleSubmit(({ nota }) => {
      const clean = (nota ?? "").trim();
      if (!clean) return;

      editarNotaMutate.mutate(
        { id, nota: clean },
        {
          onSuccess: () => closeEdit(),
        }
      );
    })();

  const confirmDeleteNota = (id: number) => {
    toast.warning("¿Eliminar nota del pedido?", {
      description: "Se quitará la nota y quedará como '-'",
      action: {
        label: "Eliminar",
        onClick: () => {
          editarNotaMutate.mutate(
            { id, nota: "-" },
            { onSuccess: () => closeEdit() }
          );
        },
      },
    });
  };

  const togglePrioridad = (it: DetalleVentaRow) => {
    setTogglingPrioridadId(it.id);
    editarPrioridadMutate.mutate(
      { id: it.id, prioridad: it.prioridad ? 0 : 1 },
      {
        onSuccess: () => setTogglingPrioridadId(null),
        onError: () => setTogglingPrioridadId(null),
      }
    );
  };

  const confirmDeleteItem = (it: DetalleVentaRow) => {
    toast.warning("¿Eliminar este producto del pedido?", {
      description: it.descripcion,
      action: {
        label: "Eliminar",
        onClick: () => {
          if (editId === it.id) closeEdit();
          setDeletingId(it.id);
          eliminarDetalleMutate.mutate(
            { id: it.id },
            {
              onSuccess: () => setDeletingId(null),
              onError: () => setDeletingId(null),
            }
          );
        },
      },
    });
  };

  if (isLoadingDetalleVenta) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <Skeleton height={18} width="70%" borderRadius={10} baseColor="#1a262e" highlightColor="#283942" />
              <div className="mt-2">
                <Skeleton height={16} width={90} borderRadius={999} baseColor="#1a262e" highlightColor="#283942" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dataDetalleVenta?.length) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-white/50">
        No hay productos en esta orden.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {dataDetalleVenta.map((it) => {
        const hasNota = !isEmptyNota(it.nota);
        const isEditingThis = editId === it.id;
        const isDeletingThis = deletingId === it.id;
        const isTogglingPrioridad = togglingPrioridadId === it.id;
        const isPrioridad = !!it.prioridad;
        const disableAll = isSavingNota || isDeletingThis;

        return (
          <div key={it.id} className={`bg-white dark:bg-[#202f36] border-2 rounded-2xl p-4 flex items-start gap-4 transition-colors ${isPrioridad ? "border-[#ff9600]" : "border-[#E5E5E5] dark:border-[#37464f]"}`}>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* Botón Eliminar */}
                <button
                  onClick={() => confirmDeleteItem(it)}
                  disabled={disableAll}
                  className="p-3 rounded-xl text-white bg-[#ff4b4b] hover:brightness-110 active:brightness-95 active:scale-95 transition disabled:opacity-60 flex items-center justify-center"
                >
                  <Icon
                    icon={isDeletingThis ? "mdi:loading" : "mdi:trash-can-outline"}
                    width="22"
                    className={isDeletingThis ? "animate-spin" : ""}
                  />
                </button>

                {/* Botón Prioridad */}
                <button
                  onClick={() => togglePrioridad(it)}
                  disabled={isTogglingPrioridad}
                  title={isPrioridad ? "Quitar prioridad" : "Dar prioridad"}
                  className={`p-3 rounded-xl text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center ${
                    isPrioridad ? "bg-[#ff9600] hover:brightness-110" : "bg-gray-400 dark:bg-[#37464f] hover:brightness-110"
                  }`}
                >
                  <Icon
                    icon={isTogglingPrioridad ? "mdi:loading" : "mdi:star"}
                    width="22"
                    className={isTogglingPrioridad ? "animate-spin" : ""}
                  />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* CANTIDAD resaltada al lado del nombre */}

                      <h3 className="text-gray-900 dark:text-white font-bold text-lg tracking-wide truncate">
                        {it.descripcion}
                      </h3>
                    </div>

                    {!!it.modificadores?.length && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {it.modificadores.map((m) => (
                          <span
                            key={m.id_modificador}
                            className="text-[10px] font-bold text-gray-500 dark:text-[#afbbc9] bg-gray-100 dark:bg-[#131f24] border border-gray-300 dark:border-[#3e525d] px-2 py-0.5 rounded-full"
                          >
                            + {m.nombre}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#43c000] text-[#131f24] px-2 py-0.5 rounded-full">
                        <Icon icon="mdi:chef-hat" />
                        {it.estado}
                      </span>
                      {isPrioridad && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#ff9500] text-[#131f24] px-2 py-0.5 rounded-full">
                          <Icon icon="mdi:star" />
                          Prioridad
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-amber-600 dark:text-[#ffd900] text-xl font-black flex items-center justify-end gap-1 drop-shadow-sm">
                      <span className="text-sm opacity-70">{simbolo}</span>
                      {it.total}
                    </div>
                    {/* Subtexto opcional para cantidad si prefieres verlo debajo del precio también */}
                    <div className="text-gray-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-tighter">
                      Cant: {it.cantidad}
                    </div>
                  </div>
                </div>

                {/* Sección de Notas */}
                <div className="mt-3">
                  {!hasNota && !isEditingThis && (
                    <button
                      onClick={() => openAdd(it)}
                      disabled={disableAll}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#2d3e47] hover:bg-gray-200 dark:hover:bg-[#314650] border border-gray-300 dark:border-[#3e525d] text-gray-600 dark:text-[#afbbc9] px-3 py-2 rounded-xl text-sm font-black transition-colors disabled:opacity-60"
                    >
                      <Icon icon="mdi:note-plus-outline" width="18" />
                      Agregar nota
                    </button>
                  )}

                  {hasNota && !isEditingThis && (
                    <div className="bg-gray-100 dark:bg-[#2d3e47] rounded-xl p-2 px-3 border border-gray-300 dark:border-[#3e525d] flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-600 dark:text-[#afbbc9] italic flex-1 min-w-0">
                        <span className="font-bold not-italic text-[#58cc02] mr-1">Nota:</span>
                        <span className="break-words">{normalizeNota(it.nota)}</span>
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(it)}
                          disabled={disableAll}
                          className="h-9 w-9 rounded-xl grid place-items-center bg-white dark:bg-[#202f36] border border-gray-300 dark:border-[#3e525d] text-amber-600 dark:text-[#ffd900] hover:brightness-110 active:scale-95 transition disabled:opacity-60"
                        >
                          <Icon icon="mdi:pencil" width="18" />
                        </button>
                        <button
                          onClick={() => confirmDeleteNota(it.id)}
                          disabled={disableAll}
                          className="h-9 w-9 rounded-xl grid place-items-center bg-white dark:bg-[#202f36] border border-gray-300 dark:border-[#3e525d] text-[#ee4c4c] hover:brightness-110 active:scale-95 transition disabled:opacity-60"
                        >
                          <Icon icon="mdi:trash-can-outline" width="18" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulario Editor de Nota */}
                  {isEditingThis && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onSave(it.id);
                      }}
                      className="bg-gray-100 dark:bg-[#2d3e47] rounded-xl border border-gray-300 dark:border-[#3e525d] overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-200 dark:bg-[#24343c] border-b border-gray-300 dark:border-[#3e525d]">
                        <div className="flex items-center gap-2">
                          <span className="text-[#58cc02]"><Icon icon="mdi:note-edit-outline" width="18" /></span>
                          <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-white/70">Nota del pedido</span>
                        </div>
                        <button type="button" onClick={closeEdit} className="h-8 w-8 rounded-lg grid place-items-center text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white" disabled={disableAll}>
                          <Icon icon="mdi:close" width="18" />
                        </button>
                      </div>
                      <div className="p-3">
                        <textarea
                          {...register("nota", {
                            required: "Escribe una nota o cancela",
                            maxLength: { value: 160, message: "Máximo 160 caracteres" },
                          })}
                          placeholder="Ej: Sin cebolla..."
                          className={`w-full resize-none bg-white dark:bg-[#202f36] border rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:border-[#1cb0f6] outline-none ${errors.nota ? "border-[#ee4c4c]" : "border-gray-300 dark:border-[#3e525d]"}`}
                          rows={2}
                          disabled={disableAll}
                        />
                        <div className="mt-3 flex items-center gap-2 justify-end">
                          <button type="button" onClick={closeEdit} className="px-3 py-2 rounded-xl text-sm font-black text-gray-500 dark:text-white/70" disabled={disableAll}>Cancelar</button>
                          <button type="submit" className="px-3 py-2 rounded-xl text-sm font-black bg-[#43c000] text-[#131f24] hover:brightness-110" disabled={disableAll || !notaValue.trim()}>
                            <span className="inline-flex items-center gap-2">
                              <Icon icon={isSavingNota ? "mdi:loading" : "mdi:content-save-outline"} width="18" className={isSavingNota ? "animate-spin" : ""} />
                              {hasNota ? "Guardar" : "Agregar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
          </div>
        );
      })}
    </div>
  );
};
