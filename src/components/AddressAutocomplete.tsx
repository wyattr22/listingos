import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

type Suggestion = {
  displayName: string;
  shortName: string;
  zip: string | null;
};

function formatAddress(result: NominatimResult): Suggestion {
  const a = result.address;
  const num = a.house_number ?? "";
  const road = a.road ?? a.pedestrian ?? a.footway ?? "";
  const city = a.city ?? a.town ?? a.village ?? a.county ?? "";
  const state = STATE_ABBREV[a.state ?? ""] ?? a.state ?? "";
  const zip = a.postcode?.split("-")[0] ?? null;

  const parts = [num && road ? `${num} ${road}` : road, city, state && zip ? `${state} ${zip}` : state].filter(Boolean);
  const shortName = parts.join(", ");

  return { displayName: result.display_name, shortName, zip };
}

type NominatimResult = {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
};

const STATE_ABBREV: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH",
  "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN",
  Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function AddressAutocomplete({ value, onChange, placeholder = "123 Main St, City, State", className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 5) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=us&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en-US" } });
      const data: NominatimResult[] = await res.json();
      const mapped = data.map(formatAddress).filter(s => s.shortName.length > 0);
      setSuggestions(mapped);
      setOpen(mapped.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (s: Suggestion) => {
    onChange(s.shortName);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent text-sm"
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <span>{s.shortName}</span>
            </li>
          ))}
          <li className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border">
            © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  );
}
