import { z } from "zod";

const relatorioBaseSchema = z.object({
  conteudo: z.string().min(1, "Conteúdo obrigatório"),
  resumo_executivo: z.string().optional(),
  sentimento: z.enum(["positivo", "neutro", "negativo"]).optional(),
  dores_identificadas: z.array(z.string()).optional(),
  objecoes: z.array(z.string()).optional(),
  bant_budget: z.string().optional(),
  bant_autoridade: z.string().optional(),
  bant_necessidade: z.string().optional(),
  bant_prazo: z.string().optional(),
  proximos_passos: z.array(z.string()).optional(),
  probabilidade_fechamento: z.number().int().min(0).max(100).optional(),
  valor_estimado_brl: z.number().nonnegative().optional(),
});

export const criarRelatorioSchema = relatorioBaseSchema.extend({
  chamada_id: z.string().uuid("chamada_id inválido"),
});

export const atualizarRelatorioSchema = relatorioBaseSchema.partial();

export type CriarRelatorioInput = z.infer<typeof criarRelatorioSchema>;
export type AtualizarRelatorioInput = z.infer<typeof atualizarRelatorioSchema>;
