#!/usr/bin/env bash
#
# Доводит сервер до рабочего состояния одной командой: сертификаты и nginx
# для Kairo, затем сайт ObserV целиком.
#
#   KAIRO_DOMAINS="kairoupdate.duckdns.org kairogoupyrlife.duckdns.org" \
#   OBSERV_DOMAINS="observ.team www.observ.team observ.space www.observ.space observ.tech www.observ.tech" \
#   bash finish.sh
#
# Любую из двух частей можно пропустить, не задав её список доменов.
#
# ВАЖНО: A-записи всех доменов должны уже указывать на этот сервер, а домены
# за Cloudflare — стоять в режиме DNS only. Проверка Let's Encrypt идёт
# извне по имени, и через оранжевое облако она не проходит.

set -euo pipefail
[[ "$EUID" -eq 0 ]] || { echo "Нужен root" >&2; exit 1; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KAIRO_DOMAINS="${KAIRO_DOMAINS:-}"
OBSERV_DOMAINS="${OBSERV_DOMAINS:-}"

step() { echo; echo "═══ $* ═══"; }

# ── Kairo ────────────────────────────────────────────────────────────────
if [[ -n "$KAIRO_DOMAINS" ]]; then
  step "Kairo: сертификат"
  DOMAINS="$KAIRO_DOMAINS" bash "$HERE/kairo/certbot-kairo.sh"

  step "Kairo: nginx"
  bash "$HERE/kairo/nginx-install.sh"
else
  echo "KAIRO_DOMAINS не задан — часть про Kairo пропущена."
fi

# ── ObserV ───────────────────────────────────────────────────────────────
if [[ -n "$OBSERV_DOMAINS" ]]; then
  step "ObserV: установка сайта"
  bash "$HERE/observ/install.sh"

  step "ObserV: сертификат"
  DOMAINS="$OBSERV_DOMAINS" bash "$HERE/observ/certbot-observ.sh"

  step "ObserV: nginx"
  read -r -a _od <<< "$OBSERV_DOMAINS"
  DOMAINS="$OBSERV_DOMAINS" \
  CERT=/etc/letsencrypt/live/observ/fullchain.pem \
  KEY=/etc/letsencrypt/live/observ/privkey.pem \
  bash "$HERE/observ/render-nginx.sh" --install
else
  echo "OBSERV_DOMAINS не задан — часть про сайт пропущена."
fi

# ── Итог ─────────────────────────────────────────────────────────────────
step "проверка"
for d in $KAIRO_DOMAINS; do
  printf '%-28s %s\n' "$d" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/health" || echo нет)"
done
for d in $OBSERV_DOMAINS; do
  case "$d" in www.*) continue ;; esac
  printf '%-28s %s\n' "$d" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/ru" || echo нет)"
done

echo
echo "200 у сайта и 200 у /health Kairo — переезд закончен."
echo "Секреты сайта: /etc/observ.env (без них форма заявки отдаёт 500)."
