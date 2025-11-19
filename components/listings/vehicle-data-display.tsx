"use client";

import { Badge } from "@/components/ui/badge";
import type { EquipmentData } from "@/lib/equipment-schema";
import { totalWeightOptions } from "@/lib/equipment-schema";

interface VehicleDataDisplayProps {
  equipment: EquipmentData | null | undefined;
}

export function VehicleDataDisplay({ equipment }: VehicleDataDisplayProps) {
  if (!equipment) {
    return null;
  }

  const hasGeneralData =
    equipment.vehicleType ||
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
    equipment.reversingCamera;

  if (!hasGeneralData) {
    return null;
  }

  return (
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
  );
}

