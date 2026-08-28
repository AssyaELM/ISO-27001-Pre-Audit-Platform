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
  public: {
    Tables: {
      ai_documents: {
        Row: {
          created_at: string
          created_by: string
          document_content: Json | null
          document_type: string
          finalized_at: string | null
          id: string
          generation_contract_version: string | null
          idempotency_key: string | null
          language: string | null
          mapping_version: string | null
          provider: string | null
          provider_model: string | null
          provider_request_id: string | null
          provider_usage: Json | null
          status: string
          template_version: string | null
          title: string | null
          updated_at: string
          version: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          document_content?: Json | null
          document_type: string
          finalized_at?: string | null
          id?: string
          generation_contract_version?: string | null
          idempotency_key?: string | null
          language?: string | null
          mapping_version?: string | null
          provider?: string | null
          provider_model?: string | null
          provider_request_id?: string | null
          provider_usage?: Json | null
          status?: string
          template_version?: string | null
          title?: string | null
          updated_at?: string
          version: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_content?: Json | null
          document_type?: string
          finalized_at?: string | null
          id?: string
          generation_contract_version?: string | null
          idempotency_key?: string | null
          language?: string | null
          mapping_version?: string | null
          provider?: string | null
          provider_model?: string | null
          provider_request_id?: string | null
          provider_usage?: Json | null
          status?: string
          template_version?: string | null
          title?: string | null
          updated_at?: string
          version?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          created_at: string
          document_owner_id: string | null
          document_type: string | null
          document_version: string | null
          effective_date: string | null
          id: string
          mime_type: string
          original_filename: string
          review_date: string | null
          size_bytes: number
          storage_bucket: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          document_owner_id?: string | null
          document_type?: string | null
          document_version?: string | null
          effective_date?: string | null
          id?: string
          mime_type: string
          original_filename: string
          review_date?: string | null
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          document_owner_id?: string | null
          document_type?: string | null
          document_version?: string | null
          effective_date?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          review_date?: string | null
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_document_owner_id_fkey"
            columns: ["document_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_question_links: {
        Row: {
          control_id: string
          evidence_id: string
          id: string
          linked_at: string
          linked_by: string
          question_id: string
          theme_id: string
          workspace_id: string
        }
        Insert: {
          control_id: string
          evidence_id: string
          id?: string
          linked_at?: string
          linked_by?: string
          question_id: string
          theme_id: string
          workspace_id: string
        }
        Update: {
          control_id?: string
          evidence_id?: string
          id?: string
          linked_at?: string
          linked_by?: string
          question_id?: string
          theme_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_question_links_item_workspace_fk"
            columns: ["evidence_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "evidence_question_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          answer: Database["public"]["Enums"]["assessment_answer"]
          comment: string | null
          control_id: string
          created_at: string
          evidence_reference: string | null
          id: string
          justification: string | null
          question_id: string
          responded_at: string
          responded_by: string
          review_status: Database["public"]["Enums"]["assessment_review_status"]
          theme_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          workspace_id: string
        }
        Insert: {
          answer: Database["public"]["Enums"]["assessment_answer"]
          comment?: string | null
          control_id: string
          created_at?: string
          evidence_reference?: string | null
          id?: string
          justification?: string | null
          question_id: string
          responded_at?: string
          responded_by: string
          review_status?: Database["public"]["Enums"]["assessment_review_status"]
          theme_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id: string
        }
        Update: {
          answer?: Database["public"]["Enums"]["assessment_answer"]
          comment?: string | null
          control_id?: string
          created_at?: string
          evidence_reference?: string | null
          id?: string
          justification?: string | null
          question_id?: string
          responded_at?: string
          responded_by?: string
          review_status?: Database["public"]["Enums"]["assessment_review_status"]
          theme_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_can_access_workspace: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      current_user_can_validate_workspace: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      current_user_workspace_role: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      evidence_storage_workspace_id: {
        Args: { object_name: string }
        Returns: string | null
      }
      evidence_document_owner_in_workspace: {
        Args: { p_owner_id: string; p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      assessment_answer:
        | "implemented"
        | "partially_implemented"
        | "not_implemented"
        | "not_sure"
        | "not_applicable"
      assessment_review_status: "draft" | "submitted" | "validated" | "rejected"
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
  public: {
    Enums: {
      assessment_answer: [
        "implemented",
        "partially_implemented",
        "not_implemented",
        "not_sure",
        "not_applicable",
      ],
      assessment_review_status: ["draft", "submitted", "validated", "rejected"],
    },
  },
} as const
