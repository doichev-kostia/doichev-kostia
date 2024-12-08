#!/usr/bin/env bash

set -e

# https://www.iana.org/assignments/media-types/application/vnd.apache.parquet

# Common settings
BUCKET="doichev-kostia-doichev-kostia-dumpbucket"
PREFIX="showcase/duckdb-parquet"
CONTENT_TYPE="application/vnd.apache.parquet"
CACHE_CONTROL="public, max-age=31536000, immutable"

# Upload 500 records file
bun x wrangler r2 object put ${BUCKET}/${PREFIX}/comparison_data_500.parquet \
  --file ./dataset/comparison_data_500.parquet \
  --content-type ${CONTENT_TYPE} \
  --cache-control "${CACHE_CONTROL}" \
  --local

# Upload 1K records file
bun x wrangler r2 object put ${BUCKET}/${PREFIX}/comparison_data_1K.parquet \
  --file ./dataset/comparison_data_1K.parquet \
  --content-type ${CONTENT_TYPE} \
  --cache-control "${CACHE_CONTROL}" \
  --local

# Upload 5K records file
bun x wrangler r2 object put ${BUCKET}/${PREFIX}/comparison_data_5K.parquet \
  --file ./dataset/comparison_data_5K.parquet \
  --content-type ${CONTENT_TYPE} \
  --cache-control "${CACHE_CONTROL}" \
  --local

# Upload 10K records file
bun x wrangler r2 object put ${BUCKET}/${PREFIX}/comparison_data_10K.parquet \
  --file ./dataset/comparison_data_10K.parquet \
  --content-type ${CONTENT_TYPE} \
  --cache-control "${CACHE_CONTROL}" \
  --local

# Upload 25K records file
bun x wrangler r2 object put ${BUCKET}/${PREFIX}/comparison_data_25K.parquet \
  --file ./dataset/comparison_data_25K.parquet \
  --content-type ${CONTENT_TYPE} \
  --cache-control "${CACHE_CONTROL}" \
  --local
