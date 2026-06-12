// ─── Supabase database types ──────────────────────────────────────────────────
// Hand-generated from the live PostgREST OpenAPI schema (2026-06-12) because
// `supabase gen types` needs CLI auth / a direct DB connection string that
// isn't available in this environment. Keep in sync with docs/migration_*.sql
// when the schema changes.

type Timestamp = string; // ISO 8601
type Uuid = string;

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: Uuid;
          external_id: string;
          title: string;
          body_snippet: string | null;
          url: string;
          published_at: Timestamp;
          source_id: Uuid | null;
          category: string | null;
          sentiment: number | null;
          severity: number | null;
          created_at: Timestamp;
          search_vector: unknown | null;
        };
        Insert: {
          id?: Uuid;
          external_id: string;
          title: string;
          body_snippet?: string | null;
          url: string;
          published_at: Timestamp;
          source_id?: Uuid | null;
          category?: string | null;
          sentiment?: number | null;
          severity?: number | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          id: Uuid;
          name: string;
          domain: string;
          credibility: number;
          source_type: string;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          domain: string;
          credibility?: number;
          source_type?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
        Relationships: [];
      };
      article_locations: {
        Row: {
          id: Uuid;
          article_id: Uuid;
          country_code: string;
          region_name: string | null;
          city_name: string | null;
          latitude: number | null;
          longitude: number | null;
          is_primary: boolean;
          confidence: number | null;
        };
        Insert: {
          id?: Uuid;
          article_id: Uuid;
          country_code: string;
          region_name?: string | null;
          city_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_primary?: boolean;
          confidence?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["article_locations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "article_locations_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      region_scores: {
        Row: {
          id: Uuid;
          country_code: string;
          time_bucket: Timestamp;
          score: number;
          article_count: number;
          top_category: string | null;
          computed_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          country_code: string;
          time_bucket: Timestamp;
          score: number;
          article_count: number;
          top_category?: string | null;
          computed_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["region_scores"]["Insert"]>;
        Relationships: [];
      };
      search_log: {
        Row: {
          id: Uuid;
          query: string;
          result_count: number;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          query: string;
          result_count?: number;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["search_log"]["Insert"]>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: Uuid;
          key: string;
          name: string;
          daily_limit: number;
          requests_today: number;
          last_request_date: string | null;
          created_at: Timestamp;
          revoked: boolean;
        };
        Insert: {
          id?: Uuid;
          key: string;
          name: string;
          daily_limit?: number;
          requests_today?: number;
          last_request_date?: string | null;
          created_at?: Timestamp;
          revoked?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [];
      };
      user_watchlists: {
        Row: {
          id: Uuid;
          user_id: Uuid;
          iso: string;
          name: string;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          user_id: Uuid;
          iso: string;
          name: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_watchlists"]["Insert"]>;
        Relationships: [];
      };
      article_reads: {
        Row: {
          id: Uuid;
          user_id: Uuid;
          article_id: Uuid;
          read_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          user_id: Uuid;
          article_id: Uuid;
          read_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["article_reads"]["Insert"]>;
        Relationships: [];
      };
      // Created by docs/migration_phase9_push.sql
      push_subscriptions: {
        Row: {
          id: Uuid;
          endpoint: string;
          p256dh: string;
          auth: string;
          watched_isos: string[];
          threshold: number;
          user_id: Uuid | null;
          last_notified_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          endpoint: string;
          p256dh: string;
          auth: string;
          watched_isos?: string[];
          threshold?: number;
          user_id?: Uuid | null;
          last_notified_at?: Timestamp | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
