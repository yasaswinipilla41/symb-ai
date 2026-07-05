ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS cert_id text;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_cert_id ON public.quiz_attempts(cert_id);

CREATE OR REPLACE FUNCTION public.base36_encode(n bigint)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  value bigint := n;
  result text := '';
  remainder int;
BEGIN
  IF value = 0 THEN
    RETURN '0';
  END IF;

  WHILE value > 0 LOOP
    remainder := (value % 36)::int;
    result := substr(chars, remainder + 1, 1) || result;
    value := value / 36;
  END LOOP;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.fnv1a32(input text)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  h bigint := 2166136261;
  i int;
  bytes bytea := convert_to(input, 'UTF8');
BEGIN
  FOR i IN 0..length(bytes) - 1 LOOP
    h := h # get_byte(bytes, i);
    h := (h * 16777619) % 4294967296;
  END LOOP;

  RETURN h;
END;
$$;

CREATE OR REPLACE FUNCTION public.certificate_id(p_user_id uuid, p_resource_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'SYM-' ||
    substr(lpad(public.base36_encode(public.fnv1a32(p_user_id::text || '::' || p_resource_name)), 6, '0'), 1, 4) ||
    '-' ||
    substr(lpad(public.base36_encode(public.fnv1a32(p_resource_name || '::' || p_user_id::text)), 6, '0'), 1, 4);
$$;

CREATE OR REPLACE FUNCTION public.set_quiz_attempt_cert_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(NEW.percentage, 0) >= 80 AND NEW.cert_id IS NULL THEN
    NEW.cert_id := public.certificate_id(NEW.user_id, NEW.resource_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quiz_attempt_cert_id ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempt_cert_id
  BEFORE INSERT OR UPDATE OF percentage, resource_name, user_id, cert_id ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_quiz_attempt_cert_id();

UPDATE public.quiz_attempts
   SET cert_id = public.certificate_id(user_id, resource_name)
 WHERE cert_id IS NULL AND percentage >= 80;

CREATE OR REPLACE FUNCTION public.get_public_certificate(p_cert_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', coalesce(q.cert_id, public.certificate_id(q.user_id, q.resource_name)),
    'resource_name', q.resource_name,
    'percentage', q.percentage,
    'created_at', q.created_at,
    'student_name', coalesce(p.full_name, p.email),
    'cert_status', q.cert_status
  ) INTO result
  FROM public.quiz_attempts q
  JOIN public.profiles p ON p.user_id = q.user_id
  WHERE q.percentage >= 80
    AND (
      q.cert_id = p_cert_id
      OR public.certificate_id(q.user_id, q.resource_name) = p_cert_id
    )
  ORDER BY q.percentage DESC, q.created_at ASC
  LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_certificate(text) TO anon, authenticated;
