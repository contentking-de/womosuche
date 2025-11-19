"use client";

interface Landlord {
  id: string;
  name: string;
  email: string;
  inquiryCount: number;
}

interface LandlordsRankingProps {
  landlords: Landlord[];
}

export function LandlordsRanking({ landlords }: LandlordsRankingProps) {
  if (landlords.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Noch keine Anfragen vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {landlords.map((landlord, index) => (
        <div
          key={landlord.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold">
              {index + 1}
            </div>
            <div>
              <div className="font-medium">{landlord.name}</div>
              <div className="text-sm text-muted-foreground">{landlord.email}</div>
            </div>
          </div>
          <div className="text-lg font-bold text-primary">
            {landlord.inquiryCount}
          </div>
        </div>
      ))}
    </div>
  );
}

