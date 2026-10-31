import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Toaster, toast } from "sonner";
import { BtnElevado } from "@/shared/ui/buttons/BtnElevado";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import {
  useActualizarEmpresaMutation,
  useSubirLogoEmpresaMutation,
} from "@/features/empresa/hooks/empresa.mutations";

type TabKey = "basico" | "moneda";

type CurrencyOption = {
  country: string;
  iso: string;
  currency: string;
  currencyName: string;
  symbol: string;
};

// paleta fija, pero el color que le toca a cada empresa sale de un hash de
// su id/nombre — mismo color siempre para la misma empresa, distinto entre
// empresas (no literalmente random en cada render).
const PALETA_AVATAR = [
  "#58cc02",
  "#1cb0f6",
  "#ff9600",
  "#ce82ff",
  "#ff4b4b",
  "#2b70c9",
  "#e91e63",
  "#00bfa5",
];

function colorAvatar(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETA_AVATAR[hash % PALETA_AVATAR.length];
}

const CURRENCIES: CurrencyOption[] = [
  { country: "Peru", iso: "PE", currency: "PEN", currencyName: "Sol", symbol: "S/" },
  { country: "Estados Unidos", iso: "US", currency: "USD", currencyName: "Dolar", symbol: "$" },
  { country: "Mexico", iso: "MX", currency: "MXN", currencyName: "Peso mexicano", symbol: "$" },
  { country: "Colombia", iso: "CO", currency: "COP", currencyName: "Peso colombiano", symbol: "$" },
  { country: "Chile", iso: "CL", currency: "CLP", currencyName: "Peso chileno", symbol: "$" },
  { country: "Argentina", iso: "AR", currency: "ARS", currencyName: "Peso argentino", symbol: "$" },
  { country: "Brasil", iso: "BR", currency: "BRL", currencyName: "Real", symbol: "R$" },
  { country: "Espana", iso: "ES", currency: "EUR", currencyName: "Euro", symbol: "EUR" },
];

export const EmpresaPage = () => {
  const navigate = useNavigate();
  const itemEmpresa = useEmpresaStore((s) => s.itemSelect);
  const actualizarEmpresa = useActualizarEmpresaMutation();
  const subirLogo = useSubirLogoEmpresaMutation();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("basico");
  const [searchCountry, setSearchCountry] = useState("");

  const [nombre, setNombre] = useState("");
  const [direccionFiscal, setDireccionFiscal] = useState("");
  const [impuesto, setImpuesto] = useState("IGV");
  const [valorImpuesto, setValorImpuesto] = useState("18");
  const [logo, setLogo] = useState("");
  const [logoRota, setLogoRota] = useState(false);

  useEffect(() => {
    setLogoRota(false);
  }, [logo]);

  const [pais, setPais] = useState("");
  const [iso, setIso] = useState("");
  const [currency, setCurrency] = useState("");
  const [nombreMoneda, setNombreMoneda] = useState("");
  const [simboloMoneda, setSimboloMoneda] = useState("");

  useEffect(() => {
    if (!itemEmpresa) return;

    setNombre(itemEmpresa.nombre ?? "");
    setDireccionFiscal(itemEmpresa.direccion_fiscal ?? "");
    setImpuesto(itemEmpresa.impuesto ?? "IGV");
    setValorImpuesto(String(itemEmpresa.valor_impuesto ?? 18));
    setLogo(itemEmpresa.logo ?? "");

    setPais(itemEmpresa.pais ?? "");
    setIso(itemEmpresa.iso ?? "");
    setCurrency(itemEmpresa.currency ?? "");
    setNombreMoneda(itemEmpresa.nombre_moneda ?? "");
    setSimboloMoneda(itemEmpresa.simbolo_moneda ?? "");
  }, [itemEmpresa]);

  const filteredCurrencies = useMemo(() => {
    const q = searchCountry.trim().toLowerCase();
    if (!q) return CURRENCIES;

    return CURRENCIES.filter((c) =>
      `${c.country} ${c.currency} ${c.currencyName} ${c.symbol}`
        .toLowerCase()
        .includes(q),
    );
  }, [searchCountry]);

  const monedaActual = useMemo(() => {
    if (!currency) return null;
    return (
      CURRENCIES.find((c) => c.currency === currency) ?? {
        country: pais || "No definido",
        iso: iso || "--",
        currency: currency || "---",
        currencyName: nombreMoneda || "Moneda",
        symbol: simboloMoneda || "-",
      }
    );
  }, [currency, pais, iso, nombreMoneda, simboloMoneda]);

  const onSelectCurrency = (c: CurrencyOption) => {
    setPais(c.country);
    setIso(c.iso);
    setCurrency(c.currency);
    setNombreMoneda(c.currencyName);
    setSimboloMoneda(c.symbol);
  };

  const onSeleccionarLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo despues

    if (!file || !itemEmpresa?.id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede pesar mas de 5MB");
      return;
    }

    const data = await subirLogo.mutateAsync({ id: itemEmpresa.id, file });
    setLogo((data as any)?.logo ?? "");
  };

  const onGuardar = async () => {
    if (!itemEmpresa?.id) return;

    await actualizarEmpresa.mutateAsync({
      id: itemEmpresa.id,
      nombre: nombre.trim() || "Empresa",
      direccion_fiscal: direccionFiscal.trim() || null,
      impuesto: impuesto.trim() || null,
      valor_impuesto: Number(valorImpuesto || 0),
      logo: logo.trim() || null,
      pais: pais || null,
      iso: iso || null,
      currency: currency || null,
      nombre_moneda: nombreMoneda || null,
      simbolo_moneda: simboloMoneda || null,
    });
  };

  if (!itemEmpresa?.id) {
    return (
      <div className="min-h-screen bg-[#e8edf4] dark:bg-[#131f24] p-8">
        <div className="mx-auto max-w-5xl rounded-3xl border-2 border-[#ccd5df] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-8">
          <h1 className="text-3xl font-black text-[#26354d] dark:text-white">Empresa</h1>
          <p className="mt-3 text-sm font-bold text-[#5d6b82] dark:text-white/50">
            No hay una empresa activa en la sesion.
          </p>
          <div className="mt-6">
            <BtnElevado titulo="Volver" funcion={() => navigate("/configurar")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8edf4] dark:bg-[#131f24] p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-[#26354d] dark:text-white">Empresa</h1>
            <BtnElevado titulo="Volver" funcion={() => navigate("/configurar")} bgcolor="#0f1e3a" decorador />
          </div>

          {activeTab === "basico" && (
            <div className="space-y-5">
              <div className="rounded-3xl border-2 border-[#2f39d9] bg-gradient-to-r from-[#3b2aca] via-[#3a28b5] to-[#2f1f95] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 rounded-2xl border-2 border-white/30 bg-white/15 p-1">
                    {logo && !logoRota ? (
                      <img
                        src={logo}
                        alt={nombre || "Empresa"}
                        onError={() => setLogoRota(true)}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-full w-full place-items-center rounded-xl text-3xl font-black text-white"
                        style={{ backgroundColor: colorAvatar(String(itemEmpresa?.id ?? nombre ?? "E")) }}
                      >
                        {(nombre.trim().charAt(0) || "E").toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={subirLogo.isPending}
                      title="Cambiar foto"
                      className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-2 border-[#2f39d9] bg-white text-[#2f1f95] shadow hover:brightness-95 disabled:opacity-60"
                    >
                      <Pencil size={14} />
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onSeleccionarLogo}
                    />
                  </div>
                  <div>
                    <p className="text-xl font-black">{nombre || "Empresa"}</p>
                    <p className="text-xs font-bold text-white/80">{direccionFiscal || "Sin direccion fiscal"}</p>
                  </div>
                </div>
              </div>

              <label className="block text-3xs font-black uppercase tracking-wider text-[#37475f] dark:text-white/70">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#b8c2cf] dark:border-[#37464f] bg-[#ecf1f8] dark:bg-[#131f24] px-4 py-3 text-lg font-bold text-[#243248] dark:text-white outline-none focus:border-[#40b8ff]"
                placeholder="Generica"
              />

              <label className="block text-3xs font-black uppercase tracking-wider text-[#37475f] dark:text-white/70">Direccion</label>
              <input
                value={direccionFiscal}
                onChange={(e) => setDireccionFiscal(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#b8c2cf] dark:border-[#37464f] bg-[#ecf1f8] dark:bg-[#131f24] px-4 py-3 text-lg font-bold text-[#243248] dark:text-white outline-none focus:border-[#40b8ff]"
                placeholder="Direccion fiscal"
              />

              <label className="block text-3xs font-black uppercase tracking-wider text-[#37475f] dark:text-white/70">Impuesto</label>
              <input
                value={impuesto}
                onChange={(e) => setImpuesto(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#b8c2cf] dark:border-[#37464f] bg-[#ecf1f8] dark:bg-[#131f24] px-4 py-3 text-lg font-bold text-[#243248] dark:text-white outline-none focus:border-[#40b8ff]"
                placeholder="IGV"
              />

              <label className="block text-3xs font-black uppercase tracking-wider text-[#37475f] dark:text-white/70">Valor impuesto</label>
              <input
                value={valorImpuesto}
                onChange={(e) => setValorImpuesto(e.target.value)}
                type="number"
                className="w-full rounded-2xl border-2 border-[#b8c2cf] dark:border-[#37464f] bg-[#ecf1f8] dark:bg-[#131f24] px-4 py-3 text-lg font-bold text-[#243248] dark:text-white outline-none focus:border-[#40b8ff]"
                placeholder="18"
              />
            </div>
          )}

          {activeTab === "moneda" && (
            <div className="space-y-5">
              <input
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#b8c2cf] dark:border-[#37464f] bg-[#ecf1f8] dark:bg-[#131f24] px-4 py-3 text-lg font-bold text-[#243248] dark:text-white outline-none focus:border-[#40b8ff]"
                placeholder="Buscar pais o moneda..."
              />

              <div className="rounded-2xl border-2 border-[#c4ced9] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-4">
                <p className="text-sm font-black text-[#2d3b52] dark:text-white">Moneda actual</p>
                {monedaActual ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#c8d4e2] dark:border-[#37464f] bg-[#f4f7fb] dark:bg-white/5 p-3">
                    <div>
                      <p className="text-sm font-black text-[#1f2d44] dark:text-white">{monedaActual.country}</p>
                      <p className="text-xs font-bold text-[#5a6880] dark:text-white/50">{monedaActual.currencyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#1f2d44] dark:text-white">{monedaActual.currency}</p>
                      <p className="text-xs font-bold text-[#5a6880] dark:text-white/50">{monedaActual.symbol}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-[#5a6880] dark:text-white/50">Aun no seleccionaste moneda.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredCurrencies.map((c) => {
                  const active = c.currency === currency;
                  return (
                    <button
                      key={c.currency}
                      type="button"
                      onClick={() => onSelectCurrency(c)}
                      className={`rounded-2xl border-2 p-3 text-left transition ${
                        active
                          ? "border-[#40b8ff] bg-[#d6ebfb] dark:bg-[#1cb0f6]/10"
                          : "border-[#c8d4e2] dark:border-[#37464f] bg-white dark:bg-[#202f36] hover:bg-[#f2f6fb] dark:hover:bg-white/10"
                      }`}
                    >
                      <p className="text-sm font-black text-[#1f2d44] dark:text-white">{c.country}</p>
                      <p className="text-xs font-bold text-[#5a6880] dark:text-white/50">{c.currencyName}</p>
                      <p className="mt-2 text-xs font-black text-[#2d3b52] dark:text-white">
                        {c.currency} - {c.symbol}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            <BtnElevado
              titulo={actualizarEmpresa.isPending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
              funcion={onGuardar}
              disabled={actualizarEmpresa.isPending}
              bgcolor="#1840c8"
              decorador
              width="240px"
              height="54px"
            />
          </div>
        </section>

        <aside className="h-fit rounded-2xl border-2 border-[#aeb8c5] dark:border-[#37464f] bg-[#e9edf4] dark:bg-[#202f36] p-4">
          <h2 className="text-2xl font-black text-[#25344b] dark:text-white">Empresa</h2>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab("basico")}
              className={`w-full rounded-2xl px-3 py-3 text-left text-lg font-black transition ${
                activeTab === "basico"
                  ? "border-2 border-[#55c2ff] bg-[#bcdff3] dark:bg-[#1cb0f6]/10 text-[#189be4]"
                  : "text-[#2e3e55] dark:text-white/70 hover:bg-[#dfe6ef] dark:hover:bg-white/10"
              }`}
            >
              Basico
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("moneda")}
              className={`w-full rounded-2xl px-3 py-3 text-left text-lg font-black transition ${
                activeTab === "moneda"
                  ? "border-2 border-[#55c2ff] bg-[#bcdff3] dark:bg-[#1cb0f6]/10 text-[#189be4]"
                  : "text-[#2e3e55] dark:text-white/70 hover:bg-[#dfe6ef] dark:hover:bg-white/10"
              }`}
            >
              Moneda
            </button>
          </div>
        </aside>
      </div>
      <Toaster position="top-center" closeButton />
    </div>
  );
};
