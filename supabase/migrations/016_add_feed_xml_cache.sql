-- =====================================================
-- 016: Persistent cache of the rendered feed XML
-- =====================================================
-- Generating the feed from the midcar.net mapping + scraping the public
-- fichas takes longer than the Netlify per-request budget, so the route
-- serves a pre-rendered XML stored here and the regenerate cron is what
-- actually does the work.

CREATE TABLE IF NOT EXISTS public.feed_xml_cache (
  id TEXT PRIMARY KEY,
  xml TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feed_xml_cache
  IS 'Rendered feed XML keyed by feed id (e.g. "merchant"). The /api/feeds/merchant.xml route reads from here; the /regenerate route writes.';

-- RLS: SELECT is open (so the public feed route can read with the anon
-- client). Writes only from service_role (server-side).
ALTER TABLE public.feed_xml_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_xml_cache_read_all"
  ON public.feed_xml_cache FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon → only service_role bypasses RLS.

-- Auto-update updated_at on row change.
CREATE OR REPLACE FUNCTION public.feed_xml_cache_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_xml_cache_touch ON public.feed_xml_cache;
CREATE TRIGGER trg_feed_xml_cache_touch
  BEFORE UPDATE ON public.feed_xml_cache
  FOR EACH ROW EXECUTE FUNCTION public.feed_xml_cache_touch();
