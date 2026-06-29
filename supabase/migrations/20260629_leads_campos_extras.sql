-- whatsapp passa a ser opcional
alter table leads alter column whatsapp drop not null;

-- novos campos de contato
alter table leads add column if not exists nome_responsavel text;
alter table leads add column if not exists email text;
