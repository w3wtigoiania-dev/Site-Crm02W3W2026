#!/usr/bin/env bash
# ==============================================================================
# INFRAASSET IT - AGENTE DE COLETA NATIVO BASH (LINUX / SERVIDORES / DESKTOPS)
# ==============================================================================
# Utiliza comandos padrão do Linux (/proc, df, free, ip, curl).
# Execução:
#   chmod +x agent_collector.sh
#   ./agent_collector.sh --server http://localhost:3000
# ==============================================================================

SERVER_URL="http://localhost:3000"
AGENT_TOKEN="infra_asset_token_secret_2026"
CLIENT_COMPANY="Hospital São Lucas"
AGENT_VERSION="2.4.0-sh"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --server) SERVER_URL="$2"; shift ;;
        --token) AGENT_TOKEN="$2"; shift ;;
        --company) CLIENT_COMPANY="$2"; shift ;;
        *) echo "Parâmetro desconhecido: $1"; exit 1 ;;
    esac
    shift
done

HOSTNAME=$(hostname)
LOGGED_USER=$(whoami)

# OS
OS_NAME="Linux"
OS_VERSION=$(grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"')
[ -z "$OS_VERSION" ] && OS_VERSION=$(uname -r)
OS_BUILD=$(uname -r)
OS_ARCH=$(uname -m)

# CPU
CPU_MODEL=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs)
[ -z "$CPU_MODEL" ] && CPU_MODEL="Linux CPU"
CORES_PHYSICAL=$(grep "cpu cores" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs)
[ -z "$CORES_PHYSICAL" ] && CORES_PHYSICAL=1
CORES_LOGICAL=$(grep -c "processor" /proc/cpuinfo 2>/dev/null)
[ -z "$CORES_LOGICAL" ] && CORES_LOGICAL=1
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')
[ -z "$CPU_USAGE" ] && CPU_USAGE=10.0

# Memory (GB)
MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))

MEM_TOTAL_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_TOTAL_KB / 1048576}")
MEM_USED_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_USED_KB / 1048576}")
MEM_FREE_GB=$(awk "BEGIN {printf \"%.2f\", $MEM_AVAIL_KB / 1048576}")
MEM_PCT=$(awk "BEGIN {printf \"%.1f\", ($MEM_USED_KB / $MEM_TOTAL_KB) * 100}")

# Network & IPs
PRIMARY_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$PRIMARY_IP" ] && PRIMARY_IP="127.0.0.1"

PRIMARY_MAC="00:00:00:00:00:00"
IFACE=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $5; exit}')
if [ -n "$IFACE" ]; then
    MAC_TEMP=$(cat /sys/class/net/"$IFACE"/address 2>/dev/null)
    [ -n "$MAC_TEMP" ] && PRIMARY_MAC=$(echo "$MAC_TEMP" | tr '[:lower:]' '[:upper:]')
fi

PUBLIC_IP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || echo "Interno")

# Disks via df
DISKS_JSON=$(df -B1G -P -x tmpfs -x devtmpfs -x squashfs | awk 'NR>1 {
  pct = substr($5, 1, length($5)-1)
  printf "{\"device\":\"%s\",\"mountpoint\":\"%s\",\"fstype\":\"local\",\"total_gb\":%s,\"used_gb\":%s,\"free_gb\":%s,\"percent\":%s},", $1, $6, $2, $3, $4, pct
}')
DISKS_JSON="[${DISKS_JSON%,}]"

# Machine type heuristic
MACHINE_TYPE="server"
if [ -d "/sys/class/power_supply" ] && ls /sys/class/power_supply/BAT* 1>/dev/null 2>&1; then
    MACHINE_TYPE="notebook"
elif systemd-detect-virt -q 2>/dev/null; then
    MACHINE_TYPE="vm"
fi

# Uptime
UPTIME_SEC=$(awk '{print int($1)}' /proc/uptime 2>/dev/null || echo 0)
BOOT_TIME=$(date -d "@$(($(date +%s) - UPTIME_SEC))" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || echo "N/A")

CLEAN_MAC=$(echo "$PRIMARY_MAC" | tr -d ':-')
CLEAN_HOST=$(echo "$HOSTNAME" | tr -cd '[:alnum:]' | tr '[:lower:]' '[:upper:]')
MACHINE_ID="${CLEAN_MAC}_${CLEAN_HOST}"

JSON_PAYLOAD=$(cat <<EOF
{
  "id": "$MACHINE_ID",
  "hostname": "$HOSTNAME",
  "logged_user": "$LOGGED_USER",
  "machine_type": "$MACHINE_TYPE",
  "os": {
    "name": "$OS_NAME",
    "version": "$OS_VERSION",
    "build": "$OS_BUILD",
    "arch": "$OS_ARCH"
  },
  "cpu": {
    "model": "$CPU_MODEL",
    "cores_physical": $CORES_PHYSICAL,
    "cores_logical": $CORES_LOGICAL,
    "freq_ghz": 2.60,
    "usage_percent": $CPU_USAGE
  },
  "memory": {
    "total_gb": $MEM_TOTAL_GB,
    "used_gb": $MEM_USED_GB,
    "free_gb": $MEM_FREE_GB,
    "percent": $MEM_PCT
  },
  "disks": $DISKS_JSON,
  "network": {
    "primary_ip": "$PRIMARY_IP",
    "primary_mac": "$PRIMARY_MAC",
    "public_ip": "$PUBLIC_IP",
    "interfaces": [
      {
        "interface_name": "$IFACE",
        "ip_address": "$PRIMARY_IP",
        "netmask": "255.255.255.0",
        "mac_address": "$PRIMARY_MAC",
        "is_up": true
      }
    ]
  },
  "uptime": {
    "seconds": $UPTIME_SEC,
    "boot_time": "$BOOT_TIME"
  },
  "agent_version": "$AGENT_VERSION",
  "client_company": "$CLIENT_COMPANY",
  "collected_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

echo "[*] Enviando telemetria Linux para $SERVER_URL/api/agent/report ..."
curl -s -X POST "$SERVER_URL/api/agent/report" \
  -H "Content-Type: application/json" \
  -H "X-Agent-Token: $AGENT_TOKEN" \
  -d "$JSON_PAYLOAD"
echo ""
