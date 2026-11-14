-- LEGACY: filtro autoritativo de lenguaje para comentarios.
-- Esta función no almacena textos. La futura operación de publicación debe
-- invocarla en PostgreSQL antes de insertar cualquier comentario.

create or replace function public.legacy_comment_language_allowed(comment_text text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  normalized text;
  blocked_terms text[] := array[
    'abortado', 'analfabeta de mierda', 'asqueroso', 'baboso', 'bestia',
    'bruto', 'cabron', 'carechimba', 'caremonda', 'chupa pija',
    'chupapija', 'cojudo', 'come mierda', 'comemierda', 'culero', 'estupida',
    'estupido', 'fuck you', 'gillipollas', 'gilipollas', 'gonorrea',
    'hijueputa', 'hijo de puta', 'hp', 'idiota de mierda', 'imbecil',
    'imbecil de mierda', 'mal nacido', 'malparida', 'malparido', 'maricon',
    'mierda', 'mongolico', 'perra', 'perra hp', 'pendeja', 'pendejo',
    'puta', 'puto', 'ramera', 'retrasado', 'retrasada', 'sidoso',
    'subnormal', 'tarado', 'zorra'
  ];
  term text;
begin
  if comment_text is null or length(btrim(comment_text)) = 0 then
    return false;
  end if;

  if length(comment_text) > 1200 then
    return false;
  end if;

  normalized := lower(comment_text);
  normalized := translate(normalized, 'áàäâãéèëêíìïîóòöôõúùüûñ', 'aaaaaeeeeiiiiooooouuuun');
  normalized := translate(normalized, '0134578@$!', 'oieastbasi');
  normalized := regexp_replace(normalized, '[​‌‍﻿]', '', 'g');
  normalized := regexp_replace(normalized, '([a-z])([._*·•|/\\-])+([a-z])', '\\1\\3', 'g');
  normalized := regexp_replace(normalized, '([^[:space:]])\1{2,}', '\1\1', 'g');
  normalized := regexp_replace(normalized, '[^a-z0-9]+', ' ', 'g');
  normalized := btrim(regexp_replace(normalized, '[[:space:]]+', ' ', 'g'));

  foreach term in array blocked_terms loop
    if position(' ' || term || ' ' in ' ' || normalized || ' ') > 0 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.legacy_comment_language_allowed(text) from public;
grant execute on function public.legacy_comment_language_allowed(text) to anon, authenticated;

comment on function public.legacy_comment_language_allowed(text) is
  'Valida lenguaje ofensivo en comentarios LEGACY; debe ejecutarse en servidor antes de insertar.';
