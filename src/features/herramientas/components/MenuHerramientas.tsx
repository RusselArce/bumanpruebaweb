export const MenuHerramientas = () => {
  const opciones = [
    { id: "reimprimir", label: "Reimprimir ticket" },
    { id: "arqueo", label: "Arqueo de caja" },
    { id: "config", label: "Configuración" },
    { id: "impresora", label: "Configurar impresora" },
    { id: "usuarios", label: "Usuarios" },
    { id: "backup", label: "Backup BD" },
  ];

  const handleClick = (id: string) => {
  };

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur-sm
      "
    >
      <section
        className="
            px-6 py-5 rounded-3xl shadow-2xl bg-[#202f36] text-white
           border-neutral-500/70 border-4 w-full max-w-md mx-4
        "
      >
        <p className="text-sm font-semibold mb-4 text-center">
          Selecciona una herramienta
        </p>

        <div className="grid grid-cols-2 gap-3">
          {opciones.map((op) => (
            <button
              key={op.id}
              onClick={() => handleClick(op.id)}
              className="
                rounded-2xl bg-gradient-to-br from-lime-400 to-green-500 text-white
                font-semibold text-sm py-3 px-3 shadow-lg shadow-lime-500/40
                hover:scale-[1.03] hover:shadow-xl active:scale-95
                transition-transform duration-150 ease-out
              "
            >
              {op.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

