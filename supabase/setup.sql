-- =========================================================================
-- UPCONVITES — banco de dados
-- Rode este script uma vez no SQL Editor do Supabase (projeto frlbmojyjzymyiyzcdrp).
-- =========================================================================

-- Cada linha é um convite. "slug" vira upconvites.com.br/<slug> e redireciona
-- para "url_destino" (o link real do convite, hoje hospedado em outro lugar).
create table if not exists public.convites (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nome_cliente   text not null,
  tipo_evento    text,
  url_destino    text not null,
  ativo          boolean not null default true,
  observacoes    text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

comment on table public.convites is 'Convites do UpConvites: slug -> URL de destino (redirecionamento).';

-- Mantém "atualizado_em" em dia a cada edição.
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_convites_atualizado_em on public.convites;
create trigger trg_convites_atualizado_em
  before update on public.convites
  for each row
  execute function public.set_atualizado_em();

-- Segurança: bloqueia todo acesso via API pública (chave anon).
-- O painel admin e o redirecionamento do domínio usam a chave "service_role"
-- (fica só no servidor, nunca no navegador), que ignora RLS — então isso aqui
-- é o que garante que ninguém de fora consiga ler ou escrever na tabela.
alter table public.convites enable row level security;
