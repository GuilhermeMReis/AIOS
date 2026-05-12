export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chamadas: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transcricoes: {
        Row: {
          id: string;
          chamada_id: string;
          conteudo: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          conteudo: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          conteudo?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      relatorios: {
        Row: {
          id: string;
          chamada_id: string;
          conteudo: string;
          gerado_em: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          conteudo: string;
          gerado_em?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          conteudo?: string;
          gerado_em?: string;
        };
        Relationships: [];
      };
      propostas: {
        Row: {
          id: string;
          chamada_id: string;
          link_externo: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chamada_id: string;
          link_externo: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chamada_id?: string;
          link_externo?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
