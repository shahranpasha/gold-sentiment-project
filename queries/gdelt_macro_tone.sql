-- Historical GDELT GKG 2.0 macro-news tone by UTC day (from 2015-02-19).
-- Run in BigQuery Studio. Use a dry run / bytes estimate before running.
-- Export the result as data/gdelt_macro_tone_export.csv.
-- GDELT V2Tone is comma-delimited; its first value is the document's average tone.

WITH macro_documents AS (
  SELECT
    PARSE_DATE('%Y%m%d', SUBSTR(`DATE`, 1, 8)) AS date,
    SAFE_CAST(SPLIT(V2Tone, ',')[SAFE_OFFSET(0)] AS FLOAT64) AS tone
  FROM `gdelt-bq.gdeltv2.gkg_partitioned`
  WHERE _PARTITIONTIME >= TIMESTAMP('2015-02-19')
    AND `DATE` >= '20150219000000'
    AND REGEXP_CONTAINS(IFNULL(V2Themes, ''), r'(^|;)(ECON_INFLATION|ECON_INTEREST_RATES|ECON_CENTRALBANK|ECON_STOCKMARKET|ECON_CURRENCY_EXCHANGE_RATE|TAX_ECON_PRICE)(,|;)')
),
valid_documents AS (
  SELECT date, tone
  FROM macro_documents
  WHERE tone IS NOT NULL
)
SELECT
  date,
  AVG(tone) AS avg_tone,
  COUNT(*) AS article_count,
  COUNTIF(tone > 0.5) AS positive_articles,
  COUNTIF(tone < -0.5) AS negative_articles
FROM valid_documents
GROUP BY date
ORDER BY date;
