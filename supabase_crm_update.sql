-- 1. ADICIONAR NOVAS COLUNAS NA TABELA LEADS EXISTENTE
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS expected_close_date DATE;

-- 2. CRIAR TABELA DE TAREFAS DOS LEADS
CREATE TABLE IF NOT EXISTS lead_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'CALL', -- 'CALL', 'EMAIL', 'MEETING', 'TODO'
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRIAR TABELA DE HISTÓRICO / NOTAS DOS LEADS
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS DE ACESSO (Permitir acesso total para usuários autenticados)
CREATE POLICY "Enable read/write for all authenticated users on lead_tasks" ON lead_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read/write for all authenticated users on lead_notes" ON lead_notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. CRIAR ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
