CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT DEFAULT '',
  instagram TEXT NOT NULL,
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  total_postagens INTEGER NOT NULL DEFAULT 0 CHECK (total_postagens >= 0),
  tipos TEXT DEFAULT '',
  valor NUMERIC(12, 2) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Concluído', 'Cancelado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.postagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Reels',
  titulo TEXT NOT NULL,
  link TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em produção', 'Agendado', 'Publicado')),
  observacoes TEXT DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_periodo ON public.contratos(periodo);
CREATE INDEX IF NOT EXISTS idx_postagens_cliente_id ON public.postagens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_postagens_contrato_id ON public.postagens(contrato_id);
CREATE INDEX IF NOT EXISTS idx_postagens_status ON public.postagens(status);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso completo a clientes para usuarios autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Acesso completo a contratos para usuarios autenticados" ON public.contratos;
DROP POLICY IF EXISTS "Acesso completo a postagens para usuarios autenticados" ON public.postagens;

CREATE POLICY "Acesso completo a clientes para usuarios autenticados"
  ON public.clientes
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a contratos para usuarios autenticados"
  ON public.contratos
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a postagens para usuarios autenticados"
  ON public.postagens
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
