#!/bin/bash
# Usage: ./ingest.sh <gutenberg_id> <output_dir> <filename_base> <title> <author> <category> <subcategory> <source_url> [notes]

GUTEN_ID="$1"
OUTPUT_DIR="$2"
FILENAME="$3"
TITLE="$4"
AUTHOR="$5"
CATEGORY="$6"
SUBCATEGORY="$7"
SOURCE_URL="$8"
NOTES="${9:-}"

RAW_URL="https://www.gutenberg.org/cache/epub/${GUTEN_ID}/pg${GUTEN_ID}.txt"

echo "Fetching: $TITLE by $AUTHOR (#$GUTEN_ID)..."

# Fetch raw text
RAW_FILE=$(mktemp)
curl -sL "$RAW_URL" -o "$RAW_FILE"

if [ ! -s "$RAW_FILE" ]; then
  echo "  ERROR: Empty response for $TITLE"
  rm -f "$RAW_FILE"
  exit 1
fi

# Extract content between START and END markers using awk
CONTENT=$(awk '
  /\*\*\* *START OF (THE|THIS) PROJECT GUTENBERG EBOOK/ { found=1; next }
  /\*\*\* *END OF (THE|THIS) PROJECT GUTENBERG EBOOK/ { found=0; next }
  found { print }
' "$RAW_FILE")

if [ -z "$CONTENT" ]; then
  echo "  WARNING: No markers found, using text after line 30"
  CONTENT=$(tail -n +30 "$RAW_FILE")
fi

rm -f "$RAW_FILE"

# Truncate very long texts to ~80KB
CONTENT_LEN=$(echo "$CONTENT" | wc -c | tr -d ' ')
if [ "$CONTENT_LEN" -gt 80000 ]; then
  CONTENT=$(echo "$CONTENT" | head -c 80000)
  # Break at last empty line
  LAST_BREAK=$(echo "$CONTENT" | grep -n '^$' | tail -1 | cut -d: -f1)
  if [ -n "$LAST_BREAK" ] && [ "$LAST_BREAK" -gt 100 ]; then
    CONTENT=$(echo "$CONTENT" | head -n "$LAST_BREAK")
  fi
  CONTENT="$CONTENT

[Text truncated for readability. Full text available at Project Gutenberg.]"
fi

# Write markdown file
MD_FILE="${OUTPUT_DIR}/${FILENAME}.md"
{
  echo "# $TITLE"
  echo ""
  echo "**Author:** $AUTHOR"
  echo ""
  echo "$CONTENT"
} > "$MD_FILE"

# Write JSON metadata
JSON_FILE="${OUTPUT_DIR}/${FILENAME}.json"
cat > "$JSON_FILE" << JSONEOF
{
  "author": "$AUTHOR",
  "work": "$TITLE",
  "primary_category": "$CATEGORY",
  "primary_subcategory": "$SUBCATEGORY",
  "source": "Project Gutenberg",
  "source_url": "$SOURCE_URL",
  "notes": "$NOTES"
}
JSONEOF

FILESIZE=$(wc -c < "$MD_FILE" | tr -d ' ')
echo "  OK: $FILENAME.md ($FILESIZE bytes)"
