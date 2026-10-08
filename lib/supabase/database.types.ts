export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          timezone: string;
          created_by: string;
        };
        Insert: {
          name: string;
          created_by: string;
          currency?: string;
          timezone?: string;
        };
        Update: {
          name?: string;
          currency?: string;
          timezone?: string;
        };
        Relationships: [];
      };
      household_invitations: {
        Row: {
          id: string;
          household_id: string;
          email_normalized: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          household_id: string;
          email_normalized: string;
          token_hash: string;
          created_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          kind: "income" | "expense" | "transfer";
          status: "planned" | "pending" | "paid";
          description: string;
          amount: number;
          occurrence_date: string;
          paid_at: string | null;
          competence_month: string;
          category_id: string | null;
          account_id: string | null;
          destination_account_id: string | null;
          credit_card_id: string | null;
          invoice_id: string | null;
          payment_method: string;
          origin: string;
          import_batch_id: string | null;
          import_fingerprint: string | null;
          responsible_user_id: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          household_id: string;
          kind: "income" | "expense" | "transfer";
          status: "planned" | "pending" | "paid";
          description: string;
          amount: number;
          occurrence_date: string;
          competence_month: string;
          category_id?: string | null;
          account_id?: string | null;
          destination_account_id?: string | null;
          payment_method: string;
          responsible_user_id: string;
          created_by: string;
          paid_at?: string | null;
          origin?: string;
          import_batch_id?: string | null;
          import_fingerprint?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["transactions"]["Insert"]
        > & {
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      household_memberships: {
        Row: {
          household_id: string;
          user_id: string;
          role: "admin";
          status: "active" | "inactive";
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "admin";
          status?: "active" | "inactive";
        };
        Update: { status?: "active" | "inactive" };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          locale: string;
          timezone: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
        };
        Update: { display_name?: string; avatar_url?: string | null };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: "income" | "expense" | "both";
          parent_id: string | null;
          color: string | null;
          position: number;
          is_system: boolean;
          church_percentage: number | null;
          archived_at: string | null;
        };
        Insert: {
          household_id: string;
          name: string;
          type: "income" | "expense" | "both";
          created_by: string;
          parent_id?: string | null;
          color?: string | null;
          position?: number;
          is_system?: boolean;
          church_percentage?: number | null;
        };
        Update: {
          name?: string;
          type?: "income" | "expense" | "both";
          parent_id?: string | null;
          color?: string | null;
          position?: number;
          church_percentage?: number | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: "checking" | "wallet" | "cash" | "savings" | "investment";
          institution: string | null;
          opening_balance: number;
          opening_balance_date: string;
          counts_as_reserve: boolean;
          active: boolean;
          archived_at: string | null;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          type: "checking" | "wallet" | "cash" | "savings" | "investment";
          institution?: string | null;
          opening_balance?: number;
          opening_balance_date?: string;
          counts_as_reserve?: boolean;
          created_by: string;
        };
        Update: {
          name?: string;
          type?: "checking" | "wallet" | "cash" | "savings" | "investment";
          institution?: string | null;
          counts_as_reserve?: boolean;
          active?: boolean;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      account_adjustments: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          amount: number;
          reason: string;
          adjusted_on: string;
        };
        Insert: {
          household_id: string;
          account_id: string;
          amount: number;
          reason: string;
          adjusted_on: string;
          created_by: string;
        };
        Update: {
          amount?: number;
          reason?: string;
          adjusted_on?: string;
        };
        Relationships: [];
      };
      credit_cards: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          institution: string | null;
          network: "visa" | "mastercard" | null;
          last_four: string | null;
          closing_day: number;
          due_day: number;
          bank_limit: number | null;
          monthly_goal: number | null;
          active: boolean;
          archived_at: string | null;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          institution?: string | null;
          network: "visa" | "mastercard";
          last_four: string;
          closing_day: number;
          due_day: number;
          bank_limit?: number | null;
          monthly_goal?: number | null;
          created_by: string;
        };
        Update: {
          name?: string;
          institution?: string | null;
          network?: "visa" | "mastercard";
          last_four?: string;
          closing_day?: number;
          due_day?: number;
          bank_limit?: number | null;
          monthly_goal?: number | null;
          active?: boolean;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      credit_card_invoices: {
        Row: {
          id: string;
          household_id: string;
          credit_card_id: string;
          reference_month: string;
          closing_date: string;
          due_date: string;
          status: "open" | "closed" | "paid";
          closed_at: string | null;
          paid_at: string | null;
        };
        Insert: {
          household_id: string;
          credit_card_id: string;
          reference_month: string;
          closing_date: string;
          due_date: string;
          status?: "open" | "closed" | "paid";
        };
        Update: {
          status?: "open" | "closed" | "paid";
          closed_at?: string | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      monthly_budgets: {
        Row: {
          id: string;
          household_id: string;
          month: string;
          created_by: string;
        };
        Insert: {
          household_id: string;
          month: string;
          created_by: string;
        };
        Update: { month?: string };
        Relationships: [];
      };
      budget_lines: {
        Row: {
          id: string;
          household_id: string;
          budget_id: string;
          category_id: string;
          allocated: number;
          church_percentage_enabled: boolean;
          manual_override: number | null;
        };
        Insert: {
          household_id: string;
          budget_id: string;
          category_id: string;
          allocated: number;
          church_percentage_enabled?: boolean;
          manual_override?: number | null;
        };
        Update: {
          allocated?: number;
          church_percentage_enabled?: boolean;
          manual_override?: number | null;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          household_id: string;
          source_filename: string;
          sha256: string;
          status: "preview" | "completed" | "failed";
          row_count: number;
          imported_count: number;
          error_summary: Json;
          created_by: string;
          completed_at: string | null;
        };
        Insert: {
          household_id: string;
          source_filename: string;
          sha256: string;
          status?: "preview" | "completed" | "failed";
          row_count?: number;
          imported_count?: number;
          error_summary?: Json;
          created_by: string;
          completed_at?: string | null;
        };
        Update: {
          status?: "preview" | "completed" | "failed";
          row_count?: number;
          imported_count?: number;
          error_summary?: Json;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          account_id: string;
          target_amount: number;
          target_date: string | null;
          priority: number;
          active: boolean;
          deleted_at: string | null;
        };
        Insert: {
          household_id: string;
          name: string;
          account_id: string;
          target_amount: number;
          target_date?: string | null;
          priority?: number;
          created_by: string;
        };
        Update: {
          name?: string;
          account_id?: string;
          target_amount?: number;
          target_date?: string | null;
          priority?: number;
          active?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      weekly_food_budgets: {
        Row: {
          id: string;
          household_id: string;
          month: string;
          starts_on: string;
          ends_on: string;
          allocated: number;
        };
        Insert: {
          household_id: string;
          month: string;
          starts_on: string;
          ends_on: string;
          allocated: number;
          created_by: string;
        };
        Update: {
          starts_on?: string;
          ends_on?: string;
          allocated?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: { household_name: string; display_name: string };
        Returns: string;
      };
      accept_household_invitation: {
        Args: { raw_token: string };
        Returns: string;
      };
      reallocate_budget: {
        Args: {
          source_line: string;
          destination_line: string;
          transfer_amount: number;
          transfer_reason?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      transaction_kind: "income" | "expense" | "transfer";
      transaction_status: "planned" | "pending" | "paid";
      payment_method:
        | "credit_card"
        | "debit_card"
        | "pix"
        | "cash"
        | "bank_transfer"
        | "other";
    };
    CompositeTypes: Record<string, never>;
  };
}
