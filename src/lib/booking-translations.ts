import type { Lang } from "./translations";

// Copy for the booking form (BookingFlow + BookingModal). Kept apart from
// TRANSLATIONS because it isn't operator-editable from /admin/website.
export interface BookingText {
  modalTitle: string;
  close: string;
  stepsLabel: string;
  steps: [string, string, string, string];
  back: string;
  next: string;
  chooseService: string;
  priceNote: string;
  tbd: string;
  customLabel: string;
  customPlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  requiredLabel: string;
  requiredBody: string;
  accessConfirm: string;
  showTimes: string;
  refreshTimes: string;
  findingSlots: string;
  noSlots: string;
  yourInfo: string;
  fullName: string;
  mobile: string;
  email: string;
  optional: string;
  customRequest: string;
  when: string;
  where: string;
  total: string;
  notSelected: string;
  notEntered: string;
  requestNote: string;
  sending: string;
  submit: string;
  genericError: string;
  networkError: string;
  thanks: string;
  confirmSoon: string;
  reference: string;
  done: string;
  dateLocale: string;
}

export const BOOKING_TEXT: Record<Lang, BookingText> = {
  en: {
    modalTitle: "Book a detail",
    close: "Close booking form",
    stepsLabel: "Booking steps",
    steps: ["Service", "Where", "When", "Your info"],
    back: "Back",
    next: "Continue",
    chooseService: "Choose your service",
    priceNote: "Prices shown are final. We accept Zelle and Cash only.",
    tbd: "TBD",
    customLabel: "Need something custom?",
    customPlaceholder: "Tell us what you're looking for and we'll follow up (optional)",
    addressLabel: "Service address",
    addressPlaceholder: "Street, city, ZIP",
    requiredLabel: "Required:",
    requiredBody:
      "outdoor water access and a working power outlet at the address. We can't detail without both.",
    accessConfirm:
      "I confirm there is outdoor water access and a working power outlet at this address.",
    showTimes: "Show open times",
    refreshTimes: "Refresh times",
    findingSlots: "Finding open slots…",
    noSlots:
      "No open times in the next few weeks. Leave your info on the next step and we'll text you a time.",
    yourInfo: "Your info",
    fullName: "Full name",
    mobile: "Mobile number",
    email: "Email",
    optional: "(optional)",
    customRequest: "Custom request",
    when: "When",
    where: "Where",
    total: "Total",
    notSelected: "Not selected",
    notEntered: "Not entered",
    requestNote: "Zelle or Cash in person. This is a request, not a confirmed booking.",
    sending: "Sending…",
    submit: "Request to Book",
    genericError: "Something went wrong.",
    networkError: "Network error. Please try again.",
    thanks: "Thank you for requesting service!",
    confirmSoon: "We will confirm your appointment shortly.",
    reference: "Reference",
    done: "Done",
    dateLocale: "en-US",
  },
  es: {
    modalTitle: "Reserva un detallado",
    close: "Cerrar formulario de reserva",
    stepsLabel: "Pasos de la reserva",
    steps: ["Servicio", "Dónde", "Cuándo", "Tus datos"],
    back: "Atrás",
    next: "Continuar",
    chooseService: "Elige tu servicio",
    priceNote: "Los precios mostrados son finales. Solo aceptamos Zelle y efectivo.",
    tbd: "Por definir",
    customLabel: "¿Necesitas algo personalizado?",
    customPlaceholder: "Cuéntanos qué buscas y te contactaremos (opcional)",
    addressLabel: "Dirección del servicio",
    addressPlaceholder: "Calle, ciudad, código postal",
    requiredLabel: "Requerido:",
    requiredBody:
      "acceso a agua en el exterior y un tomacorriente que funcione en la dirección. No podemos hacer el detallado sin ambos.",
    accessConfirm:
      "Confirmo que hay acceso a agua en el exterior y un tomacorriente que funciona en esta dirección.",
    showTimes: "Ver horarios disponibles",
    refreshTimes: "Actualizar horarios",
    findingSlots: "Buscando horarios disponibles…",
    noSlots:
      "No hay horarios disponibles en las próximas semanas. Deja tus datos en el siguiente paso y te enviaremos un mensaje con un horario.",
    yourInfo: "Tus datos",
    fullName: "Nombre completo",
    mobile: "Número de celular",
    email: "Correo electrónico",
    optional: "(opcional)",
    customRequest: "Solicitud personalizada",
    when: "Cuándo",
    where: "Dónde",
    total: "Total",
    notSelected: "Sin seleccionar",
    notEntered: "Sin ingresar",
    requestNote: "Zelle o efectivo en persona. Esto es una solicitud, no una reserva confirmada.",
    sending: "Enviando…",
    submit: "Solicitar reserva",
    genericError: "Algo salió mal.",
    networkError: "Error de red. Inténtalo de nuevo.",
    thanks: "¡Gracias por solicitar el servicio!",
    confirmSoon: "Confirmaremos tu cita en breve.",
    reference: "Referencia",
    done: "Listo",
    dateLocale: "es-US",
  },
};
