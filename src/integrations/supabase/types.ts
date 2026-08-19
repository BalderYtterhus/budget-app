export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          month: number
          total_budget: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          month: number
          total_budget?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          month?: number
          total_budget?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          household_id: string | null
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          household_id?: string | null
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          household_id?: string | null
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          amount: number
          budget_id: string
          category_id: string
          id: string
        }
        Insert: {
          amount?: number
          budget_id: string
          category_id: string
          id?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          category_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_default_categories: {
        Row: {
          category_id: string
          created_at: string
          household_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          household_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          household_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_default_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hidden_default_categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_memberships: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_memberships_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_enabled: boolean | null
          invite_expires_at: string | null
          invite_token: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_enabled?: boolean | null
          invite_expires_at?: string | null
          invite_token?: string | null
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_enabled?: boolean | null
          invite_expires_at?: string | null
          invite_token?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      item_category_mappings: {
        Row: {
          category_id: string
          created_at: string
          frequency: number
          household_id: string | null
          id: string
          item_pattern: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          frequency?: number
          household_id?: string | null
          id?: string
          item_pattern: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          frequency?: number
          household_id?: string | null
          id?: string
          item_pattern?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_category_mappings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          price_sharing_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          price_sharing_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          price_sharing_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_price_data: {
        Row: {
          category_name: string | null
          confidence: number | null
          country_code: string
          id: string
          normalized_name: string
          price: number
          quantity: number
          receipt_date: string
          store_chain: string
          submitted_at: string
          submitted_by_user_hash: string | null
          unit_price: number | null
        }
        Insert: {
          category_name?: string | null
          confidence?: number | null
          country_code?: string
          id?: string
          normalized_name: string
          price: number
          quantity?: number
          receipt_date: string
          store_chain: string
          submitted_at?: string
          submitted_by_user_hash?: string | null
          unit_price?: number | null
        }
        Update: {
          category_name?: string | null
          confidence?: number | null
          country_code?: string
          id?: string
          normalized_name?: string
          price?: number
          quantity?: number
          receipt_date?: string
          store_chain?: string
          submitted_at?: string
          submitted_by_user_hash?: string | null
          unit_price?: number | null
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          ai_predicted_category_id: string | null
          category_id: string | null
          confidence: number | null
          created_at: string
          id: string
          included_in_totals: boolean
          needs_review: boolean
          normalized_name: string | null
          price: number
          quantity: number
          raw_text: string
          receipt_id: string
          reviewed_at: string | null
          system_confidence: number | null
          unit_price: number | null
        }
        Insert: {
          ai_predicted_category_id?: string | null
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          included_in_totals?: boolean
          needs_review?: boolean
          normalized_name?: string | null
          price: number
          quantity?: number
          raw_text: string
          receipt_id: string
          reviewed_at?: string | null
          system_confidence?: number | null
          unit_price?: number | null
        }
        Update: {
          ai_predicted_category_id?: string | null
          category_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          included_in_totals?: boolean
          needs_review?: boolean
          normalized_name?: string | null
          price?: number
          quantity?: number
          raw_text?: string
          receipt_id?: string
          reviewed_at?: string | null
          system_confidence?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_ai_predicted_category_id_fkey"
            columns: ["ai_predicted_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          created_by_user: string | null
          household_id: string | null
          id: string
          image_url: string | null
          label: string | null
          paid_by_user: string | null
          raw_ocr_text: string | null
          receipt_date: string
          settlement_id: string | null
          store_chain: string | null
          store_name: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by_user?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          label?: string | null
          paid_by_user?: string | null
          raw_ocr_text?: string | null
          receipt_date?: string
          settlement_id?: string | null
          store_chain?: string | null
          store_name?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string
          created_by_user?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          label?: string | null
          paid_by_user?: string | null
          raw_ocr_text?: string | null
          receipt_date?: string
          settlement_id?: string | null
          store_chain?: string | null
          store_name?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_created_by_user_fkey"
            columns: ["created_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "receipts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_paid_by_user_fkey"
            columns: ["paid_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "receipts_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_members: {
        Row: {
          created_at: string
          id: string
          ratio: number
          settlement_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ratio?: number
          settlement_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ratio?: number
          settlement_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_members_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          created_at: string
          created_by: string | null
          household_id: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          household_id?: string | null
          id?: string
          name: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          household_id?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          added_by_user: string | null
          category_id: string | null
          created_at: string
          household_id: string
          id: string
          name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          added_by_user?: string | null
          category_id?: string | null
          created_at?: string
          household_id: string
          id?: string
          name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          added_by_user?: string | null
          category_id?: string | null
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_added_by_user_fkey"
            columns: ["added_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shopping_list_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      split_ratios: {
        Row: {
          created_at: string
          household_id: string
          id: string
          ratio: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          ratio?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          ratio?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_ratios_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_ratios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      item_price_stats: {
        Row: {
          household_id: string | null
          last_seen: string | null
          median_unit_price: number | null
          normalized_name: string | null
          sample_count: number | null
          store_chain: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clear_invite_expiry: {
        Args: { _household_id: string }
        Returns: undefined
      }
      get_user_household_ids: { Args: { _user_id: string }; Returns: string[] }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      join_household_via_invite: {
        Args: { _invite_token: string }
        Returns: Json
      }
      normalize_item_name: { Args: { raw: string }; Returns: string }
      regenerate_invite_token: {
        Args: { _household_id: string }
        Returns: string
      }
      set_invite_expiry: {
        Args: { _days?: number; _household_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
