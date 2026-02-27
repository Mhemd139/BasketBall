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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          event_id: string | null
          id: string
          marked_at: string | null
          marked_by: string | null
          status: string
          trainee_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status: string
          trainee_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          trainee_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name_ar: string
          name_en: string
          name_he: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          name_he?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          name_he?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          hall_id: string | null
          id: string
          notes: string | null
          start_time: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          hall_id?: string | null
          id?: string
          notes?: string | null
          start_time: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          hall_id?: string | null
          id?: string
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          category_id: string | null
          created_at: string | null
          hall_id: string | null
          id: string
          name_ar: string
          name_en: string
          name_he: string
          schedule_info: string | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          hall_id?: string | null
          id?: string
          name_ar: string
          name_en: string
          name_he: string
          schedule_info?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          hall_id?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          name_he?: string
          schedule_info?: string | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          class_id: string | null
          created_at: string | null
          end_time: string
          event_date: string
          hall_id: string | null
          id: string
          notes_ar: string | null
          notes_en: string | null
          notes_he: string | null
          recurrence_rule: string | null
          schedule_id: string | null
          start_time: string
          title_ar: string
          title_en: string
          title_he: string
          trainer_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          end_time: string
          event_date: string
          hall_id?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          notes_he?: string | null
          recurrence_rule?: string | null
          schedule_id?: string | null
          start_time: string
          title_ar: string
          title_en: string
          title_he: string
          trainer_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          end_time?: string
          event_date?: string
          hall_id?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          notes_he?: string | null
          recurrence_rule?: string | null
          schedule_id?: string | null
          start_time?: string
          title_ar?: string
          title_en?: string
          title_he?: string
          trainer_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      halls: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          description_he: string | null
          id: string
          name_ar: string
          name_en: string
          name_he: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_he?: string | null
          id?: string
          name_ar: string
          name_en: string
          name_he: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_he?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          name_he?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          note: string | null
          payment_date: string | null
          season: string | null
          trainee_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          note?: string | null
          payment_date?: string | null
          season?: string | null
          trainee_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          note?: string | null
          payment_date?: string | null
          season?: string | null
          trainee_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      trainees: {
        Row: {
          amount_paid: number | null
          class_id: string | null
          created_at: string | null
          gender: string | null
          id: string
          is_paid: boolean | null
          jersey_number: number | null
          name_ar: string
          name_en: string
          name_he: string
          payment_comment_ar: string | null
          payment_comment_en: string | null
          payment_comment_he: string | null
          payment_date: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          class_id?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_paid?: boolean | null
          jersey_number?: number | null
          name_ar: string
          name_en: string
          name_he: string
          payment_comment_ar?: string | null
          payment_comment_en?: string | null
          payment_comment_he?: string | null
          payment_date?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          class_id?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_paid?: boolean | null
          jersey_number?: number | null
          name_ar?: string
          name_en?: string
          name_he?: string
          payment_comment_ar?: string | null
          payment_comment_en?: string | null
          payment_comment_he?: string | null
          payment_date?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainees_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          auth_user_id: string | null
          availability: string[] | null
          availability_schedule: { day: string; start: string; end: string }[] | null
          created_at: string | null
          gender: string | null
          id: string
          name_ar: string
          name_en: string
          name_he: string
          phone: string
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          availability?: string[] | null
          availability_schedule?: { day: string; start: string; end: string }[] | null
          created_at?: string | null
          gender?: string | null
          id?: string
          name_ar: string
          name_en: string
          name_he: string
          phone: string
          role: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          availability?: string[] | null
          availability_schedule?: { day: string; start: string; end: string }[] | null
          created_at?: string | null
          gender?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          name_he?: string
          phone?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_insert_trainees_from_json: {
        Args: { p_data: Json }
        Returns: {
          inserted: number
          team: string
        }[]
      }
      bulk_upsert_attendance: { Args: { p_records: Json }; Returns: undefined }
      create_trainer: {
        Args: { p_name?: string; p_phone: string }
        Returns: {
          auth_user_id: string | null
          availability: string[] | null
          created_at: string | null
          gender: string | null
          id: string
          name_ar: string
          name_en: string
          name_he: string
          phone: string
          role: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "trainers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_class: { Args: { p_id: string }; Returns: undefined }
      delete_event: { Args: { p_id: string }; Returns: undefined }
      delete_trainee: { Args: { p_id: string }; Returns: undefined }
      delete_trainer_rpc: { Args: { p_id: string }; Returns: undefined }
      ensure_events_for_schedules: {
        Args: { p_date: string; p_day_of_week: number }
        Returns: {
          r_category_name_ar: string
          r_category_name_en: string
          r_category_name_he: string
          r_class_id: string
          r_end_time: string
          r_event_id: string
          r_event_type: string
          r_hall_id: string
          r_hall_name_ar: string
          r_hall_name_en: string
          r_hall_name_he: string
          r_schedule_id: string
          r_start_time: string
          r_title_ar: string
          r_title_en: string
          r_title_he: string
          r_trainer_id: string
          r_trainer_name_ar: string
          r_trainer_name_en: string
          r_trainer_name_he: string
        }[]
      }
      insert_category: { Args: { p_data: Json }; Returns: string }
      insert_class: { Args: { p_data: Json }; Returns: Json }
      insert_class_schedule: { Args: { p_data: Json }; Returns: string }
      insert_hall: { Args: { p_data: Json }; Returns: Json }
      insert_payment_log: {
        Args: {
          p_amount: number
          p_note?: string
          p_season?: string
          p_trainee_id: string
        }
        Returns: undefined
      }
      insert_trainee: { Args: { p_data: Json }; Returns: Json }
      update_class: { Args: { p_data: Json; p_id: string }; Returns: Json }
      update_class_schedule: {
        Args: {
          p_end_time: string
          p_hall_id: string
          p_schedule_id: string
          p_start_time: string
        }
        Returns: undefined
      }
      update_event_time: {
        Args: { p_end_time: string; p_event_id: string; p_start_time: string }
        Returns: undefined
      }
      update_hall_rpc: {
        Args: {
          p_id: string
          p_name_ar: string
          p_name_en: string
          p_name_he: string
        }
        Returns: Json
      }
      update_trainee_payment_rpc: {
        Args: { p_amount: number; p_comment?: string; p_trainee_id: string }
        Returns: undefined
      }
      update_trainee_rpc: {
        Args: { p_data: Json; p_id: string }
        Returns: undefined
      }
      update_trainer_profile: {
        Args: {
          new_name_ar: string
          new_name_en: string
          new_name_he: string
          trainer_id: string
        }
        Returns: Json
      }
      update_trainer_rpc: {
        Args: { p_data: Json; p_id: string }
        Returns: undefined
      }
      upsert_attendance: {
        Args: {
          p_event_id: string
          p_marked_by?: string
          p_status: string
          p_trainee_id: string
        }
        Returns: undefined
      }
      upsert_event: { Args: { p_data: Json }; Returns: Json }
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
  public: {
    Enums: {},
  },
} as const
