export type SupplementId = string;
export type TimeSlot = "morning" | "afternoon" | "night";
export type PersonalStatus =
  | "active"
  | "caution_sensitive"
  | "manual_research"
  | "personal_exclusion"
  | "unavailable";
export type AutomationPolicy = "eligible" | "conditional" | "manual_only" | "excluded";
export type PersistenceClass =
  | "short"
  | "medium"
  | "long_tail"
  | "saturation"
  | "tissue_saturation"
  | "unknown";

export interface SupplementProfileV1 {
  id: SupplementId;
  display_name: string;
  aliases: string[];
  available: boolean;
  pill_count_placeholder: number;
  personal_status: PersonalStatus;
  automation_policy: AutomationPolicy;
  evidence_class: string;
  dose: {
    status: "known" | "unknown" | "partial";
    value: number | null;
    unit: string | null;
    critical_for_automation: boolean;
  };
  timing: {
    allowed_slots: TimeSlot[];
    requires_food: "required" | "optional" | "fat_required" | "empty_stomach_preferred";
    avoid_late: boolean;
  };
  frequency: {
    target_mode: "fixed" | "conditional" | "rotation_group";
    target_uses_7d: number;
    max_uses_7d: number;
    minimum_gap_hours: number;
    rotation_groups: string[];
  };
  persistence: {
    class: PersistenceClass;
    residual_window_hours: number;
    precision: "governance_band_not_pharmacokinetic_claim";
  };
  classes: string[];
  pairing: {
    required_companions: SupplementId[];
    preferred_pairs: SupplementId[];
    avoid_same_day: SupplementId[];
    avoid_same_slot: SupplementId[];
    redundant_with: SupplementId[];
    preferred_contexts: string[];
    avoid_same_day_groups: string[];
  };
  body_vectors: {
    benefit: Record<string, 0 | 1 | 2 | 3>;
    burden: Record<string, 0 | 1 | 2 | 3>;
    scale: "0_none_to_3_strong_governance_heuristic";
  };
  domain_affinity: Record<string, number>;
  esoteric_affinity: {
    planets: string[];
    elements: string[];
    qualities: string[];
  };
  critical_data_fields: string[];
  provenance: {
    source: string;
    confidence: "user_protocol" | "legacy_reconstruction" | "external_reviewed";
    clinical_claim: false;
  };
  notes: string;
}
