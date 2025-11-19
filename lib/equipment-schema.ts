// Schema für strukturierte Ausstattungsdaten

export interface EquipmentData {
  // Allgemeine Fahrzeugdaten
  vehicleType?: string; // Kastenwagen, Teilintegriert, Vollintegriert, Alkoven
  year?: number;
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
  totalWeight?: string; // zulässiges Gesamtgewicht (Option aus totalWeightOptions)
  seats?: number; // Anzahl zugelassener Sitzplätze
  sleepPlaces?: number; // Anzahl Schlafplätze
  enginePower?: string; // Motorleistung
  transmission?: string; // Automatik/Manuell
  fuelType?: string; // Kraftstoffart
  fuelConsumption?: string; // Verbrauch
  reversingCamera?: boolean;

  // Schlafen
  bedTypes?: string[]; // Längsbetten, Querbett, Hubbett, Alkovenbett
  bedSizes?: string[]; // Bettgröße(n)
  bedComfort?: string[]; // Lattenroste, Komfortmatratzen
  bedConversion?: boolean; // Bettumbau aus Sitzgruppe möglich

  // Küche
  stove?: string; // 2-/3-flammig
  refrigerator?: string; // mit/ohne Gefrierfach, Größe in Litern
  sink?: boolean;
  oven?: boolean;
  microwave?: boolean;
  gasSupply?: string; // z.B. 2×11 kg
  kitchenware?: boolean; // Grundausstattung Geschirr / Kochutensilien

  // Bad
  shower?: boolean;
  toilet?: string; // Chemie / Kassette
  washbasin?: boolean;
  hotWater?: boolean;
  separateShower?: boolean; // Abtrennbare Duschkabine

  // Technik & Energie
  freshWaterTank?: number; // Liter
  wasteWaterTank?: number; // Liter
  heating?: string; // Gasheizung / Wasserheizung
  airConditioning?: string; // Fahrerhaus / Wohnbereich
  solarPower?: number; // Watt
  inverter?: boolean;
  shorePower?: boolean; // Landstromanschluss
  shorePowerCable?: boolean; // inkl. Kabel
  additionalBatteries?: boolean;

  // Innenraum & Komfort
  seating?: string; // Dinette / L-Sitzgruppe
  swivelSeats?: boolean; // Drehsitze vorne
  tv?: boolean;
  satellite?: boolean;
  usbPorts?: boolean;
  blinds?: boolean; // Verdunkelung
  flyScreen?: boolean; // Fliegenschutz
  floorHeating?: boolean;
  storage?: string[]; // Kleiderschrank, Hängeschränke, Heckgarage

  // Außen & Campingzubehör
  awning?: boolean;
  bikeRack?: string; // Anzahl Fahrräder / E-Bike-tauglich
  towbar?: boolean; // Anhängerkupplung
  campingFurniture?: boolean; // Tisch, Stühle
  levelingBlocks?: boolean; // Auffahrkeile
  outdoorSocket?: boolean; // Außensteckdose
  outdoorShower?: boolean; // Außendusche
}

export const vehicleTypes = [
  "Kastenwagen",
  "Teilintegriert",
  "Vollintegriert",
  "Alkoven",
  "Camper",
];

export const bedTypes = [
  "Längsbetten",
  "Querbett",
  "Hubbett",
  "Alkovenbett",
];

export const transmissionTypes = [
  "Automatik",
  "Manuell",
];

export const fuelTypes = [
  "Benzin",
  "Diesel",
  "Elektro",
  "Hybrid",
];

export const toiletTypes = [
  "Chemie",
  "Kassette",
];

export const heatingTypes = [
  "Gasheizung",
  "Wasserheizung",
];

export const airConditioningTypes = [
  "Fahrerhaus",
  "Wohnbereich",
  "Fahrerhaus & Wohnbereich",
];

export const seatingTypes = [
  "Dinette",
  "L-Sitzgruppe",
];

export const storageTypes = [
  "Kleiderschrank",
  "Hängeschränke",
  "Heckgarage",
];

export const totalWeightOptions = [
  { label: "PKW-Führerschein: bis 3.500 kg (Fahrbar mit B – bis 3.5 t)", value: "bis_3500" },
  { label: "Schwerer Komfort: 3.500–4.250 kg (Fahrbar mit C1 – über 3.5 t)", value: "3500_4250" },
  { label: "Große Reisemobile: 4.250–7.500 kg (Fahrbar mit C1 – über 3.5 t)", value: "4250_7500" },
  { label: "LKW-Reisemobile: über 7.500 kg (Fahrbar mit C – über 7.5 t)", value: "ueber_7500" },
];

