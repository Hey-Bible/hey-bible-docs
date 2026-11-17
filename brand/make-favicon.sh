#!/bin/zsh
# Draws static/img/favicon.png: the Hey Bible book-and-cross mark in brown ink
# on a rounded cream tile. Needs ImageMagick 7 (`magick`).
#
# Usage, from the repository root:
#   brand/make-favicon.sh
#
# The mark is drawn on the same 24-unit grid as static/img/logo.svg. It is
# drawn large and scaled down so the small icon has clean edges.
set -e

ROOT=${0:A:h}/..
OUT=$ROOT/static/img/favicon.png
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT

CREAM='#F3E8D6'; INK='#43302A'
C=512        # working canvas, px
G=440        # the 24-unit grid's box inside it, px
SIZE=64      # final icon, px

s=$(( G / 24.0 )); o=$(( (C - G) / 2.0 ))
p() { printf '%.2f' $(( o + $1 * s )) }
r() { printf '%.2f' $(( $1 * s )) }

# The mark as a mask: white where the ink goes
magick -size ${C}x${C} xc:black \
  -fill white -draw "roundrectangle $(p 4),$(p 2.5) $(p 20),$(p 21.5) $(r 3.5),$(r 3.5)" \
  -fill black -draw "roundrectangle $(p 10.8),$(p 5.2) $(p 13.2),$(p 14.2) $(r 0.6),$(r 0.6)" \
  -fill black -draw "roundrectangle $(p 8),$(p 7.8) $(p 16),$(p 10.2) $(r 0.6),$(r 0.6)" \
  -fill black -draw "roundrectangle $(p 7),$(p 16.6) $(p 17.5),$(p 19) $(r 1.2),$(r 1.2)" \
  -alpha off "$W/mask.png"
magick -size ${C}x${C} "xc:$INK" "$W/mask.png" -alpha off -compose CopyOpacity -composite "$W/mark.png"

# The cream tile, with rounded corners on a transparent ground
magick -size ${C}x${C} xc:none -fill "$CREAM" \
  -draw "roundrectangle 0,0 $(( C - 1 )),$(( C - 1 )) $(( C * 0.22 )),$(( C * 0.22 ))" "$W/tile.png"

magick "$W/tile.png" "$W/mark.png" -compose Over -composite -resize ${SIZE}x${SIZE} "$OUT"
echo "wrote $OUT"
