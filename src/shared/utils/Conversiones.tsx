
export function ConvertirCapitalize(input) {
    return (input.charAt(0).toUpperCase()+input.slice(1).toLowerCase());
  }
  export function ConvertirMinusculas(input){
    return input.toLowerCase()
  }
  export function FormatearNumeroDinero(numero,currency,iso){
    if(currency===undefined){
      return;
    }
    const esiso="es-" + iso
    const numeroconvertido=numero.toLocaleString(esiso,{style:"currency",currency:`${currency}` })
    return numeroconvertido
  }
  export  const urlToBase64 = async(imageUrl: string): Promise<string>=>{
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const reader = new FileReader()
    return new Promise<string> ((resolve,reject)=>{
      reader.onloadend=()=>{
        resolve(String(reader.result))
      }
      reader.onerror = reject;
      reader.readAsDataURL(blob)
    })
  }
  const UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const ESPECIALES: Record<number, string> = {
    10: "DIEZ", 11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISÉIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
  };
  const VEINTIS = ["VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  const DECENAS = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function convertirDecenas(n: number): string {
    if (n < 10) return UNIDADES[n];
    if (n < 20) return ESPECIALES[n];
    if (n < 30) return VEINTIS[n - 20];
    const dec = Math.floor(n / 10);
    const uni = n % 10;
    return uni > 0 ? `${DECENAS[dec]} Y ${UNIDADES[uni]}` : DECENAS[dec];
  }

  function convertirCentenas(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    const cen = Math.floor(n / 100);
    const resto = n % 100;
    if (cen === 0) return convertirDecenas(resto);
    const textoCentena = CENTENAS[cen];
    return resto > 0 ? `${textoCentena} ${convertirDecenas(resto)}` : textoCentena;
  }

  function convertirEntero(n: number): string {
    if (n === 0) return "CERO";
    if (n < 1000) return convertirCentenas(n);

    const millones = Math.floor(n / 1_000_000);
    const miles = Math.floor((n % 1_000_000) / 1000);
    const resto = n % 1000;

    const partes: string[] = [];
    if (millones > 0) {
      partes.push(millones === 1 ? "UN MILLÓN" : `${convertirEntero(millones)} MILLONES`);
    }
    if (miles > 0) {
      partes.push(miles === 1 ? "MIL" : `${convertirCentenas(miles)} MIL`);
    }
    if (resto > 0) {
      partes.push(convertirCentenas(resto));
    }
    return partes.join(" ");
  }

  export function numeroALetras(num: number, nombreMoneda: string) {
    const [entero, decimal] = num.toFixed(2).split(".");
    const n = parseInt(entero, 10);

    return `SON: ${convertirEntero(n)} CON ${decimal}/100 ${nombreMoneda}`;
  }
  
