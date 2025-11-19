"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  vehicleTypes,
  bedTypes,
  transmissionTypes,
  fuelTypes,
  toiletTypes,
  heatingTypes,
  airConditioningTypes,
  seatingTypes,
  storageTypes,
  totalWeightOptions,
} from "@/lib/equipment-schema";
import type { ListingFormData } from "./listing-form";

interface EquipmentFormProps {
  form: UseFormReturn<ListingFormData>;
  disabled?: boolean;
}

export function EquipmentForm({ form, disabled }: EquipmentFormProps) {
  const { watch, setValue } = form;
  const equipment = watch("equipment") || {};

  const updateEquipment = (field: string, value: any) => {
    setValue("equipment", { ...equipment, [field]: value });
  };

  const toggleArrayValue = (field: string, value: string) => {
    const current = (equipment[field as keyof typeof equipment] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateEquipment(field, newValue);
  };

  return (
    <div className="space-y-6">
      {/* Allgemeine Fahrzeugdaten */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Allgemeine Fahrzeugdaten</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Fahrzeugtyp</Label>
            <Select
              value={equipment.vehicleType || ""}
              onValueChange={(value) => updateEquipment("vehicleType", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Baujahr</Label>
            <Input
              id="year"
              type="number"
              placeholder="z.B. 2020"
              value={equipment.year || ""}
              onChange={(e) => updateEquipment("year", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="length">Länge (cm)</Label>
            <Input
              id="length"
              type="number"
              placeholder="z.B. 600"
              value={equipment.length || ""}
              onChange={(e) => updateEquipment("length", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Breite (cm)</Label>
            <Input
              id="width"
              type="number"
              placeholder="z.B. 220"
              value={equipment.width || ""}
              onChange={(e) => updateEquipment("width", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Höhe (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="z.B. 280"
              value={equipment.height || ""}
              onChange={(e) => updateEquipment("height", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalWeight">Zulässiges Gesamtgewicht</Label>
            <Select
              value={equipment.totalWeight || ""}
              onValueChange={(value) => updateEquipment("totalWeight", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="totalWeight">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {totalWeightOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sleepPlaces">Anzahl Schlafplätze</Label>
            <Input
              id="sleepPlaces"
              type="number"
              placeholder="z.B. 4"
              value={equipment.sleepPlaces || ""}
              onChange={(e) => updateEquipment("sleepPlaces", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enginePower">Motorleistung</Label>
            <Input
              id="enginePower"
              type="text"
              placeholder="z.B. 150 PS"
              value={equipment.enginePower || ""}
              onChange={(e) => updateEquipment("enginePower", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission">Getriebe</Label>
            <Select
              value={equipment.transmission || ""}
              onValueChange={(value) => updateEquipment("transmission", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="transmission">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {transmissionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelType">Kraftstoffart</Label>
            <Select
              value={equipment.fuelType || ""}
              onValueChange={(value) => updateEquipment("fuelType", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {fuelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelConsumption">Verbrauch</Label>
            <Input
              id="fuelConsumption"
              type="text"
              placeholder="z.B. 8,5 l/100km"
              value={equipment.fuelConsumption || ""}
              onChange={(e) => updateEquipment("fuelConsumption", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="reversingCamera"
              checked={equipment.reversingCamera || false}
              onCheckedChange={(checked) => updateEquipment("reversingCamera", checked === true)}
              disabled={disabled}
            />
            <Label htmlFor="reversingCamera" className="cursor-pointer">
              Rückfahrkamera
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Schlafen */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🛏️ Schlafen</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Betttypen</Label>
            <div className="grid grid-cols-2 gap-2">
              {bedTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bedType-${type}`}
                    checked={(equipment.bedTypes || []).includes(type)}
                    onCheckedChange={() => toggleArrayValue("bedTypes", type)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`bedType-${type}`} className="cursor-pointer text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedSizes">Bettgröße(n)</Label>
            <Input
              id="bedSizes"
              type="text"
              placeholder="z.B. 200x140 cm, 200x160 cm"
              value={(equipment.bedSizes || []).join(", ")}
              onChange={(e) => {
                const sizes = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                updateEquipment("bedSizes", sizes.length > 0 ? sizes : undefined);
              }}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Mehrere Größen mit Komma trennen
            </p>
          </div>

          <div className="space-y-2">
            <Label>Bettkomfort</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bedComfort-lattenrost"
                  checked={(equipment.bedComfort || []).includes("Lattenroste")}
                  onCheckedChange={() => toggleArrayValue("bedComfort", "Lattenroste")}
                  disabled={disabled}
                />
                <Label htmlFor="bedComfort-lattenrost" className="cursor-pointer text-sm">
                  Lattenroste
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bedComfort-matratzen"
                  checked={(equipment.bedComfort || []).includes("Komfortmatratzen")}
                  onCheckedChange={() => toggleArrayValue("bedComfort", "Komfortmatratzen")}
                  disabled={disabled}
                />
                <Label htmlFor="bedComfort-matratzen" className="cursor-pointer text-sm">
                  Komfortmatratzen
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="bedConversion"
              checked={equipment.bedConversion || false}
              onCheckedChange={(checked) => updateEquipment("bedConversion", checked === true)}
              disabled={disabled}
            />
            <Label htmlFor="bedConversion" className="cursor-pointer">
              Bettumbau aus Sitzgruppe möglich
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Küche */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🍽️ Küche</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stove">Gaskocher</Label>
            <Input
              id="stove"
              type="text"
              placeholder="z.B. 3-flammig"
              value={equipment.stove || ""}
              onChange={(e) => updateEquipment("stove", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refrigerator">Kühlschrank</Label>
            <Input
              id="refrigerator"
              type="text"
              placeholder="z.B. mit Gefrierfach, 90L"
              value={equipment.refrigerator || ""}
              onChange={(e) => updateEquipment("refrigerator", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gasSupply">Gasvorrat</Label>
            <Input
              id="gasSupply"
              type="text"
              placeholder="z.B. 2×11 kg"
              value={equipment.gasSupply || ""}
              onChange={(e) => updateEquipment("gasSupply", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sink"
                checked={equipment.sink || false}
                onCheckedChange={(checked) => updateEquipment("sink", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="sink" className="cursor-pointer">
                Spüle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="oven"
                checked={equipment.oven || false}
                onCheckedChange={(checked) => updateEquipment("oven", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="oven" className="cursor-pointer">
                Backofen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="microwave"
                checked={equipment.microwave || false}
                onCheckedChange={(checked) => updateEquipment("microwave", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="microwave" className="cursor-pointer">
                Mikrowelle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kitchenware"
                checked={equipment.kitchenware || false}
                onCheckedChange={(checked) => updateEquipment("kitchenware", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="kitchenware" className="cursor-pointer">
                Grundausstattung Geschirr / Kochutensilien
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bad */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🚿 Bad</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="toilet">Toilette</Label>
            <Select
              value={equipment.toilet || ""}
              onValueChange={(value) => updateEquipment("toilet", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="toilet">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {toiletTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shower"
                checked={equipment.shower || false}
                onCheckedChange={(checked) => updateEquipment("shower", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="shower" className="cursor-pointer">
                Dusche
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="washbasin"
                checked={equipment.washbasin || false}
                onCheckedChange={(checked) => updateEquipment("washbasin", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="washbasin" className="cursor-pointer">
                Waschbecken
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotWater"
                checked={equipment.hotWater || false}
                onCheckedChange={(checked) => updateEquipment("hotWater", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="hotWater" className="cursor-pointer">
                Warmwasser
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="separateShower"
                checked={equipment.separateShower || false}
                onCheckedChange={(checked) => updateEquipment("separateShower", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="separateShower" className="cursor-pointer">
                Abtrennbare Duschkabine
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Technik & Energie */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🔋 Technik & Energie</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="freshWaterTank">Frischwassertank (Liter)</Label>
            <Input
              id="freshWaterTank"
              type="number"
              placeholder="z.B. 100"
              value={equipment.freshWaterTank || ""}
              onChange={(e) => updateEquipment("freshWaterTank", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wasteWaterTank">Abwassertank (Liter)</Label>
            <Input
              id="wasteWaterTank"
              type="number"
              placeholder="z.B. 80"
              value={equipment.wasteWaterTank || ""}
              onChange={(e) => updateEquipment("wasteWaterTank", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heating">Heizung</Label>
            <Select
              value={equipment.heating || ""}
              onValueChange={(value) => updateEquipment("heating", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="heating">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {heatingTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="airConditioning">Klimaanlage</Label>
            <Select
              value={equipment.airConditioning || ""}
              onValueChange={(value) => updateEquipment("airConditioning", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="airConditioning">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {airConditioningTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solarPower">Solaranlage (Watt)</Label>
            <Input
              id="solarPower"
              type="number"
              placeholder="z.B. 200"
              value={equipment.solarPower || ""}
              onChange={(e) => updateEquipment("solarPower", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inverter"
                checked={equipment.inverter || false}
                onCheckedChange={(checked) => updateEquipment("inverter", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="inverter" className="cursor-pointer">
                Wechselrichter
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shorePower"
                checked={equipment.shorePower || false}
                onCheckedChange={(checked) => updateEquipment("shorePower", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="shorePower" className="cursor-pointer">
                Landstromanschluss
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shorePowerCable"
                checked={equipment.shorePowerCable || false}
                onCheckedChange={(checked) => updateEquipment("shorePowerCable", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="shorePowerCable" className="cursor-pointer">
                Landstromkabel vorhanden
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="additionalBatteries"
                checked={equipment.additionalBatteries || false}
                onCheckedChange={(checked) => updateEquipment("additionalBatteries", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="additionalBatteries" className="cursor-pointer">
                Zusatzbatterien
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Innenraum & Komfort */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🧭 Innenraum & Komfort</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seating">Sitzgruppe</Label>
            <Select
              value={equipment.seating || ""}
              onValueChange={(value) => updateEquipment("seating", value === "__none__" ? undefined : value)}
              disabled={disabled}
            >
              <SelectTrigger id="seating">
                <SelectValue placeholder="Auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Keine Angabe</SelectItem>
                {seatingTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stauraum</Label>
            <div className="grid grid-cols-2 gap-2">
              {storageTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`storage-${type}`}
                    checked={(equipment.storage || []).includes(type)}
                    onCheckedChange={() => toggleArrayValue("storage", type)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`storage-${type}`} className="cursor-pointer text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="swivelSeats"
                checked={equipment.swivelSeats || false}
                onCheckedChange={(checked) => updateEquipment("swivelSeats", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="swivelSeats" className="cursor-pointer">
                Drehsitze vorne
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tv"
                checked={equipment.tv || false}
                onCheckedChange={(checked) => updateEquipment("tv", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="tv" className="cursor-pointer">
                TV
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="satellite"
                checked={equipment.satellite || false}
                onCheckedChange={(checked) => updateEquipment("satellite", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="satellite" className="cursor-pointer">
                Satellitenanlage
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usbPorts"
                checked={equipment.usbPorts || false}
                onCheckedChange={(checked) => updateEquipment("usbPorts", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="usbPorts" className="cursor-pointer">
                USB-Steckdosen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="blinds"
                checked={equipment.blinds || false}
                onCheckedChange={(checked) => updateEquipment("blinds", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="blinds" className="cursor-pointer">
                Verdunkelung
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flyScreen"
                checked={equipment.flyScreen || false}
                onCheckedChange={(checked) => updateEquipment("flyScreen", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="flyScreen" className="cursor-pointer">
                Fliegenschutz
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="floorHeating"
                checked={equipment.floorHeating || false}
                onCheckedChange={(checked) => updateEquipment("floorHeating", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="floorHeating" className="cursor-pointer">
                Bodenheizung
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Außen & Campingzubehör */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🚴‍♂️ Außen & Campingzubehör</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bikeRack">Fahrradträger</Label>
            <Input
              id="bikeRack"
              type="text"
              placeholder="z.B. 2 Fahrräder, E-Bike-tauglich"
              value={equipment.bikeRack || ""}
              onChange={(e) => updateEquipment("bikeRack", e.target.value || undefined)}
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="awning"
                checked={equipment.awning || false}
                onCheckedChange={(checked) => updateEquipment("awning", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="awning" className="cursor-pointer">
                Markise
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="towbar"
                checked={equipment.towbar || false}
                onCheckedChange={(checked) => updateEquipment("towbar", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="towbar" className="cursor-pointer">
                Anhängerkupplung
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="campingFurniture"
                checked={equipment.campingFurniture || false}
                onCheckedChange={(checked) => updateEquipment("campingFurniture", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="campingFurniture" className="cursor-pointer">
                Campingmöbel (Tisch, Stühle)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="levelingBlocks"
                checked={equipment.levelingBlocks || false}
                onCheckedChange={(checked) => updateEquipment("levelingBlocks", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="levelingBlocks" className="cursor-pointer">
                Auffahrkeile
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outdoorSocket"
                checked={equipment.outdoorSocket || false}
                onCheckedChange={(checked) => updateEquipment("outdoorSocket", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="outdoorSocket" className="cursor-pointer">
                Außensteckdose
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outdoorShower"
                checked={equipment.outdoorShower || false}
                onCheckedChange={(checked) => updateEquipment("outdoorShower", checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="outdoorShower" className="cursor-pointer">
                Außendusche
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

