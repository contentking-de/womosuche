"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { EquipmentData } from "@/lib/equipment-schema";
import { totalWeightOptions } from "@/lib/equipment-schema";

interface EquipmentDisplayProps {
  equipment: EquipmentData | null | undefined;
}

export function EquipmentDisplay({ equipment }: EquipmentDisplayProps) {
  if (!equipment || Object.keys(equipment).length === 0) {
    return null;
  }

  const hasValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value === true;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const renderValue = (value: any): string => {
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Allgemeine Fahrzeugdaten */}
      {(equipment.vehicleType ||
        equipment.year ||
        equipment.length ||
        equipment.width ||
        equipment.height ||
        equipment.totalWeight ||
        equipment.sleepPlaces ||
        equipment.enginePower ||
        equipment.transmission ||
        equipment.fuelType ||
        equipment.fuelConsumption ||
        equipment.reversingCamera) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Allgemeine Fahrzeugdaten</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {equipment.vehicleType && (
              <div>
                <span className="text-sm text-muted-foreground">Fahrzeugtyp:</span>{" "}
                <span className="font-medium">{equipment.vehicleType}</span>
              </div>
            )}
            {equipment.year && (
              <div>
                <span className="text-sm text-muted-foreground">Baujahr:</span>{" "}
                <span className="font-medium">{equipment.year}</span>
              </div>
            )}
            {(equipment.length || equipment.width || equipment.height) && (
              <div>
                <span className="text-sm text-muted-foreground">Abmessungen:</span>{" "}
                <span className="font-medium">
                  {equipment.length && `${equipment.length} cm`}
                  {equipment.length && equipment.width && " × "}
                  {equipment.width && `${equipment.width} cm`}
                  {(equipment.length || equipment.width) && equipment.height && " × "}
                  {equipment.height && `${equipment.height} cm`}
                </span>
              </div>
            )}
            {equipment.totalWeight && (
              <div>
                <span className="text-sm text-muted-foreground">Zulässiges Gesamtgewicht:</span>{" "}
                <span className="font-medium">
                  {totalWeightOptions.find((opt) => opt.value === equipment.totalWeight)?.label || equipment.totalWeight}
                </span>
              </div>
            )}
            {equipment.sleepPlaces && (
              <div>
                <span className="text-sm text-muted-foreground">Schlafplätze:</span>{" "}
                <span className="font-medium">{equipment.sleepPlaces}</span>
              </div>
            )}
            {equipment.enginePower && (
              <div>
                <span className="text-sm text-muted-foreground">Motorleistung:</span>{" "}
                <span className="font-medium">{equipment.enginePower}</span>
              </div>
            )}
            {equipment.transmission && (
              <div>
                <span className="text-sm text-muted-foreground">Getriebe:</span>{" "}
                <span className="font-medium">{equipment.transmission}</span>
              </div>
            )}
            {equipment.fuelType && (
              <div>
                <span className="text-sm text-muted-foreground">Kraftstoffart:</span>{" "}
                <span className="font-medium">{equipment.fuelType}</span>
              </div>
            )}
            {equipment.fuelConsumption && (
              <div>
                <span className="text-sm text-muted-foreground">Verbrauch:</span>{" "}
                <span className="font-medium">{equipment.fuelConsumption}</span>
              </div>
            )}
            {equipment.reversingCamera && (
              <div>
                <span className="text-sm text-muted-foreground">Rückfahrkamera:</span>{" "}
                <Badge variant="secondary">Vorhanden</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schlafen */}
      {(equipment.bedTypes?.length ||
        equipment.bedSizes?.length ||
        equipment.bedComfort?.length ||
        equipment.bedConversion) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🛏️ Schlafen</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.bedTypes && equipment.bedTypes.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Betttypen:</span>{" "}
                  <span className="font-medium">{equipment.bedTypes.join(", ")}</span>
                </div>
              )}
              {equipment.bedSizes && equipment.bedSizes.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Bettgröße(n):</span>{" "}
                  <span className="font-medium">{equipment.bedSizes.join(", ")}</span>
                </div>
              )}
              {equipment.bedComfort && equipment.bedComfort.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Bettkomfort:</span>{" "}
                  <span className="font-medium">{equipment.bedComfort.join(", ")}</span>
                </div>
              )}
              {equipment.bedConversion && (
                <div>
                  <span className="text-sm text-muted-foreground">Bettumbau:</span>{" "}
                  <Badge variant="secondary">Aus Sitzgruppe möglich</Badge>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Küche */}
      {(equipment.stove ||
        equipment.refrigerator ||
        equipment.sink ||
        equipment.oven ||
        equipment.microwave ||
        equipment.gasSupply ||
        equipment.kitchenware) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🍽️ Küche</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.stove && (
                <div>
                  <span className="text-sm text-muted-foreground">Gaskocher:</span>{" "}
                  <span className="font-medium">{equipment.stove}</span>
                </div>
              )}
              {equipment.refrigerator && (
                <div>
                  <span className="text-sm text-muted-foreground">Kühlschrank:</span>{" "}
                  <span className="font-medium">{equipment.refrigerator}</span>
                </div>
              )}
              {equipment.gasSupply && (
                <div>
                  <span className="text-sm text-muted-foreground">Gasvorrat:</span>{" "}
                  <span className="font-medium">{equipment.gasSupply}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {equipment.sink && <Badge variant="secondary">Spüle</Badge>}
                {equipment.oven && <Badge variant="secondary">Backofen</Badge>}
                {equipment.microwave && <Badge variant="secondary">Mikrowelle</Badge>}
                {equipment.kitchenware && <Badge variant="secondary">Geschirr / Kochutensilien</Badge>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bad */}
      {(equipment.shower ||
        equipment.toilet ||
        equipment.washbasin ||
        equipment.hotWater ||
        equipment.separateShower) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🚿 Bad</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.toilet && (
                <div>
                  <span className="text-sm text-muted-foreground">Toilette:</span>{" "}
                  <span className="font-medium">{equipment.toilet}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {equipment.shower && <Badge variant="secondary">Dusche</Badge>}
                {equipment.washbasin && <Badge variant="secondary">Waschbecken</Badge>}
                {equipment.hotWater && <Badge variant="secondary">Warmwasser</Badge>}
                {equipment.separateShower && <Badge variant="secondary">Abtrennbare Duschkabine</Badge>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Technik & Energie */}
      {(equipment.freshWaterTank ||
        equipment.wasteWaterTank ||
        equipment.heating ||
        equipment.airConditioning ||
        equipment.solarPower ||
        equipment.inverter ||
        equipment.shorePower ||
        equipment.shorePowerCable ||
        equipment.additionalBatteries) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🔋 Technik & Energie</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.freshWaterTank && (
                <div>
                  <span className="text-sm text-muted-foreground">Frischwassertank:</span>{" "}
                  <span className="font-medium">{equipment.freshWaterTank} Liter</span>
                </div>
              )}
              {equipment.wasteWaterTank && (
                <div>
                  <span className="text-sm text-muted-foreground">Abwassertank:</span>{" "}
                  <span className="font-medium">{equipment.wasteWaterTank} Liter</span>
                </div>
              )}
              {equipment.heating && (
                <div>
                  <span className="text-sm text-muted-foreground">Heizung:</span>{" "}
                  <span className="font-medium">{equipment.heating}</span>
                </div>
              )}
              {equipment.airConditioning && (
                <div>
                  <span className="text-sm text-muted-foreground">Klimaanlage:</span>{" "}
                  <span className="font-medium">{equipment.airConditioning}</span>
                </div>
              )}
              {equipment.solarPower && (
                <div>
                  <span className="text-sm text-muted-foreground">Solaranlage:</span>{" "}
                  <span className="font-medium">{equipment.solarPower} Watt</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {equipment.inverter && <Badge variant="secondary">Wechselrichter</Badge>}
                {equipment.shorePower && <Badge variant="secondary">Landstromanschluss</Badge>}
                {equipment.shorePowerCable && <Badge variant="secondary">Landstromkabel</Badge>}
                {equipment.additionalBatteries && <Badge variant="secondary">Zusatzbatterien</Badge>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Innenraum & Komfort */}
      {(equipment.seating ||
        equipment.swivelSeats ||
        equipment.tv ||
        equipment.satellite ||
        equipment.usbPorts ||
        equipment.blinds ||
        equipment.flyScreen ||
        equipment.floorHeating ||
        equipment.storage?.length) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🧭 Innenraum & Komfort</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.seating && (
                <div>
                  <span className="text-sm text-muted-foreground">Sitzgruppe:</span>{" "}
                  <span className="font-medium">{equipment.seating}</span>
                </div>
              )}
              {equipment.storage && equipment.storage.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Stauraum:</span>{" "}
                  <span className="font-medium">{equipment.storage.join(", ")}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {equipment.swivelSeats && <Badge variant="secondary">Drehsitze vorne</Badge>}
                {equipment.tv && <Badge variant="secondary">TV</Badge>}
                {equipment.satellite && <Badge variant="secondary">Satellitenanlage</Badge>}
                {equipment.usbPorts && <Badge variant="secondary">USB-Steckdosen</Badge>}
                {equipment.blinds && <Badge variant="secondary">Verdunkelung</Badge>}
                {equipment.flyScreen && <Badge variant="secondary">Fliegenschutz</Badge>}
                {equipment.floorHeating && <Badge variant="secondary">Bodenheizung</Badge>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Außen & Campingzubehör */}
      {(equipment.awning ||
        equipment.bikeRack ||
        equipment.towbar ||
        equipment.campingFurniture ||
        equipment.levelingBlocks ||
        equipment.outdoorSocket ||
        equipment.outdoorShower) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">🚴‍♂️ Außen & Campingzubehör</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {equipment.bikeRack && (
                <div>
                  <span className="text-sm text-muted-foreground">Fahrradträger:</span>{" "}
                  <span className="font-medium">{equipment.bikeRack}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {equipment.awning && <Badge variant="secondary">Markise</Badge>}
                {equipment.towbar && <Badge variant="secondary">Anhängerkupplung</Badge>}
                {equipment.campingFurniture && <Badge variant="secondary">Campingmöbel</Badge>}
                {equipment.levelingBlocks && <Badge variant="secondary">Auffahrkeile</Badge>}
                {equipment.outdoorSocket && <Badge variant="secondary">Außensteckdose</Badge>}
                {equipment.outdoorShower && <Badge variant="secondary">Außendusche</Badge>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

