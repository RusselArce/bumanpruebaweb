import { useState } from "react";
import type { ClientesProveedores } from "@/shared/types/db/tablas";
import { BuscadorModal } from "@/shared/ui/buscadores/BuscadorModal";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue.hook";
import { useBuscarClientesQuery } from "@/features/clientes/hooks/clientes.queries";
import { useClientesStore } from "@/features/clientes/store/clientes.store";
import { FormClientes } from "@/features/clientes/components/FormClientes";

export const BuscadorClientesModal = ({
  isOpen,
  onClose,
  idEmpresa,
}: {
  isOpen: boolean;
  onClose: () => void;
  idEmpresa: ClientesProveedores["id_empresa"];
}) => {
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 350);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useBuscarClientesQuery(debounced);

  const setSelected = useClientesStore((s) => s.setItemSelect);

  return (
    <>
      <BuscadorModal<ClientesProveedores>
        isOpen={isOpen}
        onClose={onClose}
        title="Buscar cliente"
        placeholder="Nombre, DNI o RUC..."
        query={q}
        setQuery={setQ}
        items={data}
        isLoading={isLoading}
        minChars={2}
        emptyText="No se encontraron clientes"
        getKey={(c) => c.id}
        onSelect={(c) => setSelected(c)}
        renderItem={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white font-black truncate">{c.nombres}</div>
              <div className="text-[11px] text-white/50 font-bold">
                DNI: {c.identificador_nacional ?? "-"} • RUC:{" "}
                {c.identificador_fiscal ?? "-"}
              </div>
            </div>
            <div className="text-[10px] font-black px-2 py-1 rounded-full bg-[#58cc02] text-[#131f24]">
              Seleccionar
            </div>
          </div>
        )}
        extraAction={{
          label: "Nuevo cliente",
          onClick: () => setShowForm(true),
        }}
      />

      <FormClientes
        open={showForm}
        mode="Nuevo"
        initial={{ nombres: q }}
        onClose={() => setShowForm(false)}
        onCreated={(cliente) => {
          setSelected(cliente);
          setShowForm(false);
          onClose();
        }}
      />
    </>
  );
};
