/**
 * Tipos de la base de datos de Supabase para HIRAM Directory.
 * Refleja el esquema inicial y las migraciones aplicadas.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "user" | "admin";
export type ProviderType = "individual" | "company";
export type ProfessionalStatus = "pending" | "approved" | "rejected" | "suspended";
export type SubscriptionStatus = "pending" | "active" | "expired" | "suspended";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type ProfileEventType = "impression" | "visit" | "whatsapp_click" | "call_click";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      states: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      municipalities: {
        Row: {
          id: string;
          state_id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          state_id: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          state_id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      localities: {
        Row: {
          id: string;
          municipality_id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          municipality_id: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          municipality_id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          listing_slug: string;
          singular_label: string;
          plural_label: string;
          seo_intro: string | null;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          listing_slug: string;
          singular_label: string;
          plural_label: string;
          seo_intro?: string | null;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          listing_slug?: string;
          singular_label?: string;
          plural_label?: string;
          seo_intro?: string | null;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          owner_id: string;
          business_name: string;
          slug: string;
          description: string | null;
          logo_path: string | null;
          locality_id: string | null;
          service_areas: string[];
          experience_years: number | null;
          working_hours: Json;
          availability: string;
          status: ProfessionalStatus;
          approved_at: string | null;
          approved_by: string | null;
          terms_accepted_at: string;
          created_at: string;
          updated_at: string;
          provider_type: ProviderType;
          id_type: string | null;
          id_number: string | null;
          contact_person_name: string | null;
          instagram_handle: string | null;
          tiktok_handle: string | null;
          facebook_url: string | null;
          website_url: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          business_name: string;
          slug: string;
          description?: string | null;
          logo_path?: string | null;
          locality_id?: string | null;
          service_areas?: string[];
          experience_years?: number | null;
          working_hours?: Json;
          availability?: string;
          status?: ProfessionalStatus;
          approved_at?: string | null;
          approved_by?: string | null;
          terms_accepted_at?: string;
          created_at?: string;
          updated_at?: string;
          provider_type?: ProviderType;
          id_type?: string | null;
          id_number?: string | null;
          contact_person_name?: string | null;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          facebook_url?: string | null;
          website_url?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          business_name?: string;
          slug?: string;
          description?: string | null;
          logo_path?: string | null;
          locality_id?: string | null;
          service_areas?: string[];
          experience_years?: number | null;
          working_hours?: Json;
          availability?: string;
          status?: ProfessionalStatus;
          approved_at?: string | null;
          approved_by?: string | null;
          terms_accepted_at?: string;
          created_at?: string;
          updated_at?: string;
          provider_type?: ProviderType;
          id_type?: string | null;
          id_number?: string | null;
          contact_person_name?: string | null;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          facebook_url?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      professional_contacts: {
        Row: {
          professional_id: string;
          whatsapp_phone: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          professional_id: string;
          whatsapp_phone?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          professional_id?: string;
          whatsapp_phone?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      professional_categories: {
        Row: {
          professional_id: string;
          category_id: string;
        };
        Insert: {
          professional_id: string;
          category_id: string;
        };
        Update: {
          professional_id?: string;
          category_id?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          duration_days: number;
          features: Json;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          currency?: string;
          duration_days?: number;
          features?: Json;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          duration_days?: number;
          features?: Json;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          professional_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          starts_at: string | null;
          ends_at: string | null;
          activated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          activated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          activated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          professional_id: string;
          subscription_id: string | null;
          amount: number;
          currency: string;
          payment_method: string;
          reference_number: string | null;
          status: PaymentStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          amount_usd: number | null;
          rate_used: number | null;
          amount_bs: number | null;
          rate_date: string | null;
        };
        Insert: {
          id?: string;
          professional_id: string;
          subscription_id?: string | null;
          amount: number;
          currency?: string;
          payment_method: string;
          reference_number?: string | null;
          status?: PaymentStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          amount_usd?: number | null;
          rate_used?: number | null;
          amount_bs?: number | null;
          rate_date?: string | null;
        };
        Update: {
          id?: string;
          professional_id?: string;
          subscription_id?: string | null;
          amount?: number;
          currency?: string;
          payment_method?: string;
          reference_number?: string | null;
          status?: PaymentStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          amount_usd?: number | null;
          rate_used?: number | null;
          amount_bs?: number | null;
          rate_date?: string | null;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          currency_pair: string;
          rate: number;
          source: string;
          source_updated_at: string;
          created_at: string;
          created_by: string | null;
          is_active: boolean;
          status: string;
          variation_percentage: number | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          currency_pair?: string;
          rate: number;
          source: string;
          source_updated_at?: string;
          created_at?: string;
          created_by?: string | null;
          is_active?: boolean;
          status?: string;
          variation_percentage?: number | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          currency_pair?: string;
          rate?: number;
          source?: string;
          source_updated_at?: string;
          created_at?: string;
          created_by?: string | null;
          is_active?: boolean;
          status?: string;
          variation_percentage?: number | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      payment_settings: {
        Row: {
          id: string;
          bank_name: string;
          bank_code: string;
          id_type: string;
          id_number: string;
          phone: string;
          account_holder: string;
          instructions: string;
          is_active: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          bank_name: string;
          bank_code?: string;
          id_type?: string;
          id_number?: string;
          phone?: string;
          account_holder?: string;
          instructions?: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          bank_name?: string;
          bank_code?: string;
          id_type?: string;
          id_number?: string;
          phone?: string;
          account_holder?: string;
          instructions?: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      payment_receipts: {
        Row: {
          id: string;
          payment_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_events: {
        Row: {
          id: string;
          professional_id: string;
          event_type: ProfileEventType;
          visitor_hash: string;
          dedupe_key: string;
          channel: string | null;
          counts_toward_free_quota: boolean;
          is_quota_contact: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          event_type: ProfileEventType;
          visitor_hash: string;
          dedupe_key: string;
          channel?: string | null;
          counts_toward_free_quota?: boolean;
          is_quota_contact?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          event_type?: ProfileEventType;
          visitor_hash?: string;
          dedupe_key?: string;
          channel?: string | null;
          counts_toward_free_quota?: boolean;
          is_quota_contact?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      professional_services: {
        Row: {
          id: string;
          professional_id: string;
          service_id: string | null;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          service_id?: string | null;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          service_id?: string | null;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      professional_photos: {
        Row: {
          id: string;
          professional_id: string;
          image_path: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          image_path: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          image_path?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      professionals_public: {
        Row: {
          id: string;
          slug: string;
          business_name: string;
          description: string | null;
          logo_path: string | null;
          locality_id: string | null;
          service_areas: string[];
          experience_years: number | null;
          working_hours: Json;
          availability: string;
          created_at: string;
          provider_type: ProviderType;
          contact_person_name: string | null;
          instagram_handle: string | null;
          tiktok_handle: string | null;
          facebook_url: string | null;
          website_url: string | null;
          contacts_enabled: boolean;
          is_featured: boolean;
        };
        Relationships: [];
      };
      listing_combinations: {
        Row: {
          category_id: string;
          listing_slug: string;
          plural_label: string;
          locality_id: string;
          locality_slug: string;
          locality_name: string;
          municipality_slug: string;
          municipality_name: string;
          professional_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_set_professional_status: {
        Args: {
          p_professional_id: string;
          p_status: ProfessionalStatus;
          p_note?: string | null;
        };
        Returns: void;
      };
      record_profile_visit: {
        Args: {
          p_professional_id: string;
          p_visitor_hash: string;
          p_dedupe_key: string;
          p_actor_id?: string | null;
        };
        Returns: boolean;
      };
      reveal_professional_contact: {
        Args: {
          p_professional_id: string;
          p_channel: string;
          p_visitor_hash: string;
          p_dedupe_key: string;
          p_actor_id?: string | null;
        };
        Returns: Json;
      };
      get_professional_metrics: {
        Args: {
          p_professional_id: string;
        };
        Returns: Json;
      };
      submit_manual_payment: {
        Args: {
          p_professional_id: string;
          p_plan_id: string;
          p_payment_method: string;
          p_reference_number: string;
          p_receipt_storage_path: string;
          p_receipt_mime_type: string;
          p_receipt_size_bytes: number;
        };
        Returns: Json;
      };
      get_billing_status: {
        Args: Record<string, never>;
        Returns: Json;
      };
      admin_set_billing_enabled: {
        Args: {
          p_enabled: boolean;
          p_banner_text?: string | null;
          p_banner_enabled?: boolean | null;
        };
        Returns: Json;
      };
      admin_review_payment: {
        Args: {
          p_payment_id: string;
          p_decision: string;
          p_rejection_reason?: string | null;
        };
        Returns: Json;
      };
      admin_set_manual_rate: {
        Args: {
          p_rate: number;
        };
        Returns: Json;
      };
      admin_revert_to_automated_rate: {
        Args: Record<string, never>;
        Returns: Json;
      };
      admin_review_pending_rate: {
        Args: {
          p_rate_id: string;
          p_decision: string;
        };
        Returns: Json;
      };
    };
  };
}
