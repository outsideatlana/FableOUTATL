/**
 * Minimal hand-written Supabase schema types.
 * Mirror of supabase/migrations/0001_init.sql. If you change the schema,
 * regenerate or update these to keep type-safety end to end.
 */

export type EventStatus = 'draft' | 'published' | 'sold_out' | 'archived';
export type ApplicationType = 'intern' | 'freelancer' | 'vendor' | 'dj';
export type ApplicationStatus =
  | 'new'
  | 'reviewed'
  | 'contacted'
  | 'accepted'
  | 'rejected';

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  hero_image_url: string | null;
  hero_image_pathname: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface RsvpRow {
  id: string;
  event_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  notes: string | null;
  created_at: string;
}

export interface ApplicationRow {
  id: string;
  type: ApplicationType;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  portfolio_url: string | null;
  experience: string | null;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface RecapRow {
  id: string;
  event_id: string | null;
  image_url: string;
  image_pathname: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface InterestSignupRow {
  id: string;
  concept_name: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export interface Database {
  public: {
    Tables: {
      events: Table<EventRow>;
      rsvps: Table<RsvpRow>;
      applications: Table<ApplicationRow>;
      recaps: Table<RecapRow>;
      interest_signups: Table<InterestSignupRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_status: EventStatus;
      application_type: ApplicationType;
      application_status: ApplicationStatus;
    };
  };
}
