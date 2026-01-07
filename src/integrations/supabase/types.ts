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
      adicionais: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_adicional"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["tipo_adicional"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_adicional"]
          updated_at?: string
        }
        Relationships: []
      }
      enderecos: {
        Row: {
          bairro: string
          complemento: string | null
          created_at: string
          id: string
          is_default: boolean
          numero: string
          profile_id: string
          referencia: string | null
          rua: string
          updated_at: string
        }
        Insert: {
          bairro?: string
          complemento?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          numero?: string
          profile_id: string
          referencia?: string | null
          rua?: string
          updated_at?: string
        }
        Update: {
          bairro?: string
          complemento?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          numero?: string
          profile_id?: string
          referencia?: string | null
          rua?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enderecos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_item_adicionais: {
        Row: {
          adicional_nome: string
          created_at: string
          id: string
          pedido_item_id: string
        }
        Insert: {
          adicional_nome: string
          created_at?: string
          id?: string
          pedido_item_id: string
        }
        Update: {
          adicional_nome?: string
          created_at?: string
          id?: string
          pedido_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_item_adicionais_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          created_at: string
          embalagem: Database["public"]["Enums"]["tipo_embalagem"]
          id: string
          pedido_id: string
          peso: string
          produto_id: string | null
          produto_nome: string
          quantidade: number
          tamanho: Database["public"]["Enums"]["tamanho_produto"]
          valor_adicionais: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          embalagem?: Database["public"]["Enums"]["tipo_embalagem"]
          id?: string
          pedido_id: string
          peso: string
          produto_id?: string | null
          produto_nome: string
          quantidade?: number
          tamanho: Database["public"]["Enums"]["tamanho_produto"]
          valor_adicionais?: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          embalagem?: Database["public"]["Enums"]["tipo_embalagem"]
          id?: string
          pedido_id?: string
          peso?: string
          produto_id?: string | null
          produto_nome?: string
          quantidade?: number
          tamanho?: Database["public"]["Enums"]["tamanho_produto"]
          valor_adicionais?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          endereco_bairro: string
          endereco_complemento: string | null
          endereco_numero: string
          endereco_referencia: string | null
          endereco_rua: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          numero_pedido: string
          status: Database["public"]["Enums"]["status_pedido"]
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          endereco_bairro: string
          endereco_complemento?: string | null
          endereco_numero: string
          endereco_referencia?: string | null
          endereco_rua: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          numero_pedido: string
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
          valor_total: number
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          endereco_bairro?: string
          endereco_complemento?: string | null
          endereco_numero?: string
          endereco_referencia?: string | null
          endereco_rua?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          numero_pedido?: string
          status?: Database["public"]["Enums"]["status_pedido"]
          updated_at?: string
          valor_total?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          adicionais_gratis: number
          ativo: boolean
          categoria: Database["public"]["Enums"]["categoria_produto"]
          created_at: string
          id: string
          nome: string
          peso: string
          preco: number
          preco_adicional_extra: number
          tamanho: Database["public"]["Enums"]["tamanho_produto"]
          updated_at: string
        }
        Insert: {
          adicionais_gratis?: number
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_produto"]
          created_at?: string
          id?: string
          nome: string
          peso: string
          preco: number
          preco_adicional_extra?: number
          tamanho: Database["public"]["Enums"]["tamanho_produto"]
          updated_at?: string
        }
        Update: {
          adicionais_gratis?: number
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_produto"]
          created_at?: string
          id?: string
          nome?: string
          peso?: string
          preco?: number
          preco_adicional_extra?: number
          tamanho?: Database["public"]["Enums"]["tamanho_produto"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bairro: string
          complemento: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          numero: string
          referencia: string | null
          rua: string
          telefone: string
          tipo_cliente: string
          updated_at: string
          valor_total_compras: number
        }
        Insert: {
          bairro?: string
          complemento?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          numero?: string
          referencia?: string | null
          rua?: string
          telefone: string
          tipo_cliente?: string
          updated_at?: string
          valor_total_compras?: number
        }
        Update: {
          bairro?: string
          complemento?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          numero?: string
          referencia?: string | null
          rua?: string
          telefone?: string
          tipo_cliente?: string
          updated_at?: string
          valor_total_compras?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente"
      categoria_produto: "acai" | "barcas" | "sorvetes" | "picoles" | "bebidas"
      forma_pagamento: "credito" | "debito" | "pix" | "dinheiro"
      status_pedido:
        | "pendente"
        | "confirmado"
        | "preparo"
        | "pronto"
        | "entrega"
        | "entregue"
      tamanho_produto: "pequeno" | "medio" | "grande" | "gg" | "mega"
      tipo_adicional: "frutas" | "doces" | "cereais"
      tipo_embalagem: "copo" | "isopor"
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
      app_role: ["admin", "cliente"],
      categoria_produto: ["acai", "barcas", "sorvetes", "picoles", "bebidas"],
      forma_pagamento: ["credito", "debito", "pix", "dinheiro"],
      status_pedido: [
        "pendente",
        "confirmado",
        "preparo",
        "pronto",
        "entrega",
        "entregue",
      ],
      tamanho_produto: ["pequeno", "medio", "grande", "gg", "mega"],
      tipo_adicional: ["frutas", "doces", "cereais"],
      tipo_embalagem: ["copo", "isopor"],
    },
  },
} as const
