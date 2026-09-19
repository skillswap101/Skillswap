#!/data/data/com.termux/files/usr/bin/bash

FILE="$1"
START="${2:-1}"
SIZE="${3:-120}"

if [ -z "$FILE" ]; then
  echo "Usage: ./inspect_parts.sh FILE START SIZE"
  exit 1
fi

TOTAL=$(wc -l < "$FILE")
END=$((START + SIZE - 1))

if [ "$END" -gt "$TOTAL" ]; then
  END="$TOTAL"
fi

echo "============================================================"
echo "FILE: $FILE"
echo "TOTAL LINES: $TOTAL"
echo "SHOWING: $START-$END"
echo "============================================================"
echo

nl -ba "$FILE" | sed -n "${START},${END}p"

echo
echo "============================================================"
echo "NEXT PART STARTS AT LINE $((END + 1))"
echo "============================================================"
