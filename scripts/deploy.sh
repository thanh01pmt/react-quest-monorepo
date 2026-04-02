#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# deploy.sh — Script triển khai Docker Stack cho Tin Học Trẻ Backend
#
# Cách dùng:
#   ./scripts/deploy.sh [command] [options]
#
# Commands:
#   start          — Khởi động toàn bộ stack (lần đầu hoặc sau update)
#   stop           — Tắt toàn bộ stack
#   restart        — Restart lại tất cả services
#   status         — Xem trạng thái các containers
#   logs [service] — Xem logs realtime (api | judge | redis)
#   scale N        — Scale judge workers lên N instances
#   update         — Pull code mới, rebuild images, rolling restart
#   build          — Build lại tất cả Docker images từ đầu
#   clean          — Dọn dẹp containers, images cũ (CẢNH BÁO: xóa data)
# ════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Màu sắc terminal ─────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e " ${BLUE}$1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

# ── Kiểm tra cần thiết ───────────────────────────────────────────────
check_requirements() {
  command -v docker        &>/dev/null || error "Docker chưa được cài đặt!"
  command -v docker-compose &>/dev/null || command -v docker compose &>/dev/null || error "docker-compose chưa được cài đặt!"
  [ -f ".env" ] || error "File .env chưa tồn tại! Hãy sao chép từ .env.example:\n  cp .env.example .env\n  Và điền đầy đủ thông tin rồi thử lại."
}

# ── Docker Compose wrapper (hỗ trợ cả v1 và v2) ─────────────────────
dc() {
  if command -v docker-compose &>/dev/null; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

# ── Subcommands ──────────────────────────────────────────────────────
cmd_start() {
  header "Khởi động Tin Học Trẻ Backend Stack"
  check_requirements
  log "Building Docker images..."
  dc build
  log "Khởi động services..."
  dc up -d
  sleep 3
  cmd_status
}

cmd_stop() {
  header "Tắt toàn bộ Stack"
  dc down
  log "Đã tắt tất cả services."
}

cmd_restart() {
  header "Restart Stack"
  dc restart
  log "Đã restart xong."
  cmd_status
}

cmd_status() {
  header "Trạng thái Services"
  dc ps
}

cmd_logs() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    dc logs -f --tail=100 "$service"
  else
    dc logs -f --tail=100
  fi
}

cmd_scale() {
  local n="${1:-}"
  [ -z "$n" ] && error "Vui lòng cung cấp số lượng judge workers.\nVD: ./scripts/deploy.sh scale 3"
  [[ "$n" =~ ^[0-9]+$ ]] || error "Số lượng phải là số nguyên dương."
  
  header "Scale Judge Workers → $n instances"
  dc up -d --scale judge="$n"
  log "Đã scale judge lên $n workers."
  dc ps
}

cmd_update() {
  header "Cập nhật Code và Rebuild"
  check_requirements
  
  warn "Đang pull code mới từ Git..."
  git pull
  
  log "Rebuild Docker images (không downtime)..."
  dc build api judge
  
  log "Rolling restart API..."
  dc up -d --no-deps api
  
  log "Rolling restart Judge workers..."
  dc up -d --no-deps judge
  
  sleep 2
  cmd_status
  log "Đã cập nhật thành công!"
}

cmd_build() {
  header "Build lại tất cả Docker Images"
  check_requirements
  dc build --no-cache
  log "Build hoàn tất."
}

cmd_clean() {
  header "Dọn dẹp Docker Resources"
  warn "CẢNH BÁO: Hành động này sẽ xóa toàn bộ containers và images."
  warn "Data trong Redis Volume sẽ bị MẤT nếu chọn prune volumes!"
  echo ""
  read -rp "Xóa containers và images (không xóa volumes)? [y/N]: " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    dc down --rmi local
    docker image prune -f
    log "Đã dọn dẹp containers và images cũ."
  else
    log "Đã hủy."
  fi
}

# ── Hiển thị trợ giúp ────────────────────────────────────────────────
cmd_help() {
  echo ""
  echo -e "${BLUE}Tin Học Trẻ — Docker Deployment Script${NC}"
  echo ""
  echo "  Cách dùng: ./scripts/deploy.sh [command] [options]"
  echo ""
  echo "  Commands:"
  echo -e "    ${GREEN}start${NC}          Khởi động toàn bộ stack"
  echo -e "    ${GREEN}stop${NC}           Tắt toàn bộ stack"
  echo -e "    ${GREEN}restart${NC}        Restart tất cả services"
  echo -e "    ${GREEN}status${NC}         Xem trạng thái containers"
  echo -e "    ${GREEN}logs [service]${NC} Xem logs (api | judge | redis)"
  echo -e "    ${GREEN}scale N${NC}        Scale judge lên N instances"
  echo -e "    ${GREEN}update${NC}         Pull code mới + rolling restart"
  echo -e "    ${GREEN}build${NC}          Build lại tất cả images"
  echo -e "    ${GREEN}clean${NC}          Dọn dẹp containers/images cũ"
  echo ""
  echo "  Ví dụ:"
  echo "    ./scripts/deploy.sh start"
  echo "    ./scripts/deploy.sh scale 5"
  echo "    ./scripts/deploy.sh logs judge"
  echo ""
}

# ── Main dispatcher ──────────────────────────────────────────────────
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  logs)    cmd_logs "${1:-}" ;;
  scale)   cmd_scale "${1:-}" ;;
  update)  cmd_update ;;
  build)   cmd_build ;;
  clean)   cmd_clean ;;
  help|-h|--help) cmd_help ;;
  *) error "Lệnh không hợp lệ: '$COMMAND'. Chạy './scripts/deploy.sh help' để xem trợ giúp." ;;
esac
