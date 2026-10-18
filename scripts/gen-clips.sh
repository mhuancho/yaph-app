#!/usr/bin/env bash
# Genera los clips 9:16 de demostración con ffmpeg (fuentes procedurales lavfi).
# Se versionan en public/clips/ para que la demo no dependa de la red.
set -euo pipefail

OUT="${1:?uso: gen-clips.sh <directorio-salida>}"
mkdir -p "$OUT"

DUR=8
W=540
H=960
FPS=24

# Pad de audio: dos senos y un trémolo. Queda muy bajo (el feed arranca
# silenciado) pero hace que el botón de audio signifique algo.
AUDIO='sine=f=110:d=8[a1];sine=f=164.8:d=8[a2];[a1][a2]amix=inputs=2[amix];[amix]tremolo=f=1.8:d=0.6,volume=0.18[aout]'

encode() {
  local name="$1" crf="$2" vf="$3"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "$vf" \
    -filter_complex "$AUDIO" \
    -map 0:v -map '[aout]' \
    -t "$DUR" \
    -c:v libx264 -preset slower -crf "$crf" -g 48 -pix_fmt yuv420p -profile:v main \
    -c:a aac -b:a 48k -ac 1 \
    -movflags +faststart \
    "$OUT/$name.mp4"
  printf '  %-18s %s\n' "$name.mp4" "$(du -h "$OUT/$name.mp4" | cut -f1)"
}

echo "Generando clips ${W}x${H} @ ${FPS}fps, ${DUR}s:"

# 1. Rejilla neón: mandelbrot desplazado a cian/azul.
encode neon-grid 40 \
  "mandelbrot=size=${W}x${H}:rate=${FPS}:maxiter=180:start_scale=2.6:end_scale=0.08,gblur=sigma=0.8,format=gray,format=gbrp,colorchannelmixer=rr=0.06:gg=0.96:bb=0.84,curves=all='0/0 0.45/0.14 1/1',eq=contrast=1.25"

# 2. Onda de pulso: autómata celular «life» en magenta/violeta.
encode pulse-wave 42 \
  "life=size=180x320:rate=${FPS}:mold=12:ratio=0.12:death_color=#FF2A85:life_color=#7C5CFF:stitch=0,scale=${W}:${H}:flags=neighbor,gblur=sigma=1.4,eq=contrast=1.2:brightness=0.02"

# 3. Deriva holográfica: degradado en espiral violeta/cian/magenta.
encode holo-drift 32 \
  "gradients=size=${W}x${H}:rate=${FPS}:c0=0x7C5CFF:c1=0x00F5D4:c2=0xFF2A85:c3=0x050508:nb_colors=4:type=spiral:speed=0.015,eq=saturation=1.2"

# 4. Lluvia de datos: regla 110 desplazándose, teñida de cian.
encode data-rain 40 \
  "cellauto=rule=110:size=${W}x${H}:rate=${FPS}:random_fill_ratio=0.03:scroll=1:stitch=1,gblur=sigma=1.3,format=gray,format=gbrp,colorchannelmixer=rr=0.02:gg=0.96:bb=0.8,curves=all='0/0 0.55/0.18 1/1',eq=contrast=1.4"

# 5. Floración espectral: «life» en ámbar/magenta con bloom falso (blur + eq).
encode spectral-bloom 42 \
  "life=size=120x214:rate=${FPS}:mold=22:ratio=0.18:death_color=#FFB020:life_color=#FF2A85:stitch=0,scale=${W}:${H}:flags=bicubic,gblur=sigma=3.2,eq=contrast=1.35:saturation=1.4"

# 6. Atardecer vectorial: degradado radial ámbar/magenta con viñeta y grano.
encode vector-dusk 34 \
  "gradients=size=${W}x${H}:rate=${FPS}:c0=0xFF2A85:c1=0xFFB020:c2=0x120B18:nb_colors=3:type=radial:speed=0.012,vignette=PI/4.2,eq=saturation=1.15"

echo
echo "Total: $(du -sh "$OUT" | cut -f1)"
