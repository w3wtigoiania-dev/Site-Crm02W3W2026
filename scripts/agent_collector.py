#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
INFRAASSET IT - AGENTE DE COLETA DE HARDWARE E SOFTWARE MULTIPLATAFORMA
==============================================================================
Compatível com: Windows 10/11, Windows Server (2016/2019/2022), Linux (Ubuntu, Debian, RHEL, CentOS)
Requisitos: Python 3.8+ e biblioteca 'psutil' (pip install psutil)
Fallback de envio: usa 'urllib.request' nativo se 'requests' não estiver instalado.

Instruções de Execução:
  python agent_collector.py --server http://seu-servidor:3000 --token AGENT_SECRET_2026

Para Logon no Windows (sem janela de terminal):
  pythonw.exe agent_collector.py
==============================================================================
"""

import sys
import os
import json
import time
import socket
import platform
import getpass
import argparse
import shutil
from datetime import datetime, timezone

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("[INFO] 'psutil' não encontrado. Usando fallback da biblioteca padrão do Python. (Dica: 'pip install psutil' para telemetria avançada)")

# Configurações padrão (podem ser sobrescritas por variáveis de ambiente ou argumentos)
DEFAULT_SERVER_URL = os.environ.get("INVENTORY_SERVER_URL", "http://localhost:3000")
DEFAULT_API_TOKEN = os.environ.get("INVENTORY_AGENT_TOKEN", "infra_asset_token_secret_2026")
AGENT_VERSION = "2.4.0"


def get_public_ip(timeout=3):
    """Obtém o IP público através de serviços rápidos e confiáveis com fallback silencioso."""
    providers = [
        "https://api.ipify.org?format=json",
        "https://ipinfo.io/json",
        "https://ifconfig.me/ip"
    ]
    import urllib.request
    
    for url in providers:
        try:
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": f"InfraAsset-Agent/{AGENT_VERSION}"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                content = response.read().decode('utf-8').strip()
                if "{" in content:
                    data = json.loads(content)
                    return data.get("ip") or data.get("query") or ""
                return content
        except Exception:
            continue
    return "N/A (Offline/Interno)"


def get_cpu_info():
    """Detecta modelo e características do processador."""
    model = platform.processor() or "Processador Genérico"
    
    # Detalhamento no Linux via /proc/cpuinfo
    if platform.system() == "Linux":
        try:
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        model = line.split(":", 1)[1].strip()
                        break
        except Exception:
            pass
    elif platform.system() == "Windows":
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            model, _ = winreg.QueryValueEx(key, "ProcessorNameString")
            winreg.CloseKey(key)
        except Exception:
            pass
            
    if HAS_PSUTIL:
        physical_cores = psutil.cpu_count(logical=False) or 1
        logical_cores = psutil.cpu_count(logical=True) or 1
        freq_ghz = 2.40
        try:
            freq = psutil.cpu_freq()
            if freq and freq.current:
                freq_ghz = round(freq.current / 1000.0, 2)
            elif freq and freq.max:
                freq_ghz = round(freq.max / 1000.0, 2)
        except Exception:
            pass
        cpu_usage = psutil.cpu_percent(interval=0.5)
    else:
        import os
        logical_cores = os.cpu_count() or 1
        physical_cores = max(1, logical_cores // 2)
        freq_ghz = 2.40
        cpu_usage = 12.0

    return {
        "model": model.strip(),
        "cores_physical": physical_cores,
        "cores_logical": logical_cores,
        "freq_ghz": freq_ghz,
        "usage_percent": cpu_usage
    }


def get_memory_info():
    """Calcula capacidade e uso da memória RAM."""
    if HAS_PSUTIL:
        vm = psutil.virtual_memory()
        return {
            "total_gb": round(vm.total / (1024 ** 3), 2),
            "used_gb": round(vm.used / (1024 ** 3), 2),
            "free_gb": round(vm.available / (1024 ** 3), 2),
            "percent": vm.percent
        }
    
    # Fallback Linux /proc/meminfo
    if platform.system() == "Linux":
        try:
            mem = {}
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    parts = line.split(":")
                    if len(parts) == 2:
                        mem[parts[0].strip()] = int(parts[1].split()[0])
            total_kb = mem.get("MemTotal", 8388608)
            avail_kb = mem.get("MemAvailable", mem.get("MemFree", 4194304))
            used_kb = total_kb - avail_kb
            return {
                "total_gb": round(total_kb / (1024 ** 2), 2),
                "used_gb": round(used_kb / (1024 ** 2), 2),
                "free_gb": round(avail_kb / (1024 ** 2), 2),
                "percent": round((used_kb / total_kb) * 100, 1)
            }
        except Exception:
            pass

    return {
        "total_gb": 16.0,
        "used_gb": 8.5,
        "free_gb": 7.5,
        "percent": 53.1
    }


def get_disk_info():
    """Coleta informações de todas as partições físicas e volumes montados."""
    disks = []
    
    if HAS_PSUTIL:
        seen_mounts = set()
        for part in psutil.disk_partitions(all=False):
            if part.mountpoint in seen_mounts: continue
            if part.fstype in ("", "squashfs", "tmpfs", "devtmpfs", "overlay", "iso9660"): continue
            if "loop" in part.device or "/snap/" in part.mountpoint: continue
            try:
                usage = psutil.disk_usage(part.mountpoint)
                seen_mounts.add(part.mountpoint)
                disks.append({
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype,
                    "total_gb": round(usage.total / (1024 ** 3), 2),
                    "used_gb": round(usage.used / (1024 ** 3), 2),
                    "free_gb": round(usage.free / (1024 ** 3), 2),
                    "percent": usage.percent
                })
            except (PermissionError, OSError):
                continue
        if disks:
            return disks

    # Fallback standard library shutil.disk_usage
    try:
        root_path = "C:\\" if platform.system() == "Windows" else "/"
        usage = shutil.disk_usage(root_path)
        total_gb = round(usage.total / (1024 ** 3), 2)
        used_gb = round(usage.used / (1024 ** 3), 2)
        free_gb = round(usage.free / (1024 ** 3), 2)
        pct = round((used_gb / total_gb) * 100, 1) if total_gb > 0 else 0.0
        disks.append({
            "device": root_path,
            "mountpoint": root_path,
            "fstype": "LocalFS",
            "total_gb": total_gb,
            "used_gb": used_gb,
            "free_gb": free_gb,
            "percent": pct
        })
    except Exception:
        pass

    return disks


def get_network_info():
    """Coleta interfaces de rede, IPs locais e endereço MAC."""
    interfaces = []
    primary_ip = "127.0.0.1"
    primary_mac = "00:00:00:00:00:00"

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
    except Exception:
        primary_ip = socket.gethostbyname(socket.gethostname())

    if HAS_PSUTIL:
        addrs = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
        for iface_name, addr_list in addrs.items():
            if iface_name.lower().startswith("lo"): continue
            ipv4 = None
            netmask = None
            mac = None
            is_up = stats[iface_name].isup if iface_name in stats else True

            for addr in addr_list:
                if addr.family == socket.AF_INET:
                    ipv4 = addr.address
                    netmask = addr.netmask
                elif getattr(addr, 'family', None) == getattr(psutil, 'AF_LINK', -1) or str(addr.family) in ("17", "AF_LINK"):
                    mac = addr.address

            if mac and (mac.count(":") == 5 or mac.count("-") == 5):
                mac = mac.upper().replace("-", ":")
                if ipv4 == primary_ip:
                    primary_mac = mac

            if ipv4 or mac:
                interfaces.append({
                    "interface_name": iface_name,
                    "ip_address": ipv4 or "Não atribuído",
                    "netmask": netmask or "255.255.255.0",
                    "mac_address": mac or "Desconhecido",
                    "is_up": is_up
                })

    if primary_mac == "00:00:00:00:00:00":
        # Fallback MAC via uuid.getnode
        import uuid
        mac_num = uuid.getnode()
        mac_hex = f"{mac_num:012X}"
        primary_mac = ":".join(mac_hex[i:i+2] for i in range(0, 12, 2))
        interfaces.append({
            "interface_name": "Standard NIC",
            "ip_address": primary_ip,
            "netmask": "255.255.255.0",
            "mac_address": primary_mac,
            "is_up": True
        })

    return {
        "primary_ip": primary_ip,
        "primary_mac": primary_mac,
        "interfaces": interfaces
    }


def detect_machine_type():
    """Detecta se o ativo é Servidor, Notebook, Desktop ou Máquina Virtual."""
    sys_name = platform.system().lower()
    
    if HAS_PSUTIL:
        try:
            battery = psutil.sensors_battery()
            if battery is not None:
                return "notebook"
        except Exception:
            pass

    vm_indicators = ["vmware", "virtualbox", "qemu", "kvm", "hyper-v", "xen", "innotek"]
    cpu_str = platform.processor().lower()
    if any(ind in cpu_str for ind in vm_indicators):
        return "vm"

    if "windows" in sys_name:
        win_release = platform.release().lower()
        if "server" in win_release or "server" in platform.version().lower():
            return "server"
    elif "linux" in sys_name:
        hostname = socket.gethostname().lower()
        if "srv" in hostname or "server" in hostname:
            return "server"

    return "desktop"


def get_uptime_info():
    """Calcula o tempo de atividade do sistema operacional."""
    if HAS_PSUTIL:
        boot_time_ts = psutil.boot_time()
        uptime_seconds = int(time.time() - boot_time_ts)
        boot_datetime = datetime.fromtimestamp(boot_time_ts, tz=timezone.utc)
        return {
            "seconds": uptime_seconds,
            "boot_time": boot_datetime.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        
    if platform.system() == "Linux":
        try:
            with open("/proc/uptime", "r") as f:
                uptime_seconds = int(float(f.readline().split()[0]))
            boot_time_ts = time.time() - uptime_seconds
            boot_datetime = datetime.fromtimestamp(boot_time_ts, tz=timezone.utc)
            return {
                "seconds": uptime_seconds,
                "boot_time": boot_datetime.strftime("%Y-%m-%d %H:%M:%S UTC")
            }
        except Exception:
            pass

    return {
        "seconds": 3600,
        "boot_time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }


def collect_inventory_payload():
    """Agrega todas as informações do hardware e software em um único JSON estruturado."""
    hostname = socket.gethostname()
    logged_user = getpass.getuser()
    
    # Dados do SO
    os_name = platform.system()  # 'Windows', 'Linux', 'Darwin'
    os_version = platform.release()
    os_build = platform.version()
    os_arch = platform.machine()
    
    if os_name == "Darwin":
        os_name = "macOS"

    cpu_info = get_cpu_info()
    mem_info = get_memory_info()
    disks = get_disk_info()
    net_info = get_network_info()
    uptime_info = get_uptime_info()
    public_ip = get_public_ip()
    machine_type = detect_machine_type()

    # Gerador de identificador persistente baseado em MAC + Hostname
    raw_uid = f"{net_info['primary_mac']}_{hostname}".upper().replace(":", "").replace("-", "")

    payload = {
        "id": raw_uid,
        "hostname": hostname,
        "logged_user": logged_user,
        "machine_type": machine_type,
        "os": {
            "name": os_name,
            "version": os_version,
            "build": os_build,
            "arch": os_arch
        },
        "cpu": cpu_info,
        "memory": mem_info,
        "disks": disks,
        "network": {
            "primary_ip": net_info["primary_ip"],
            "primary_mac": net_info["primary_mac"],
            "public_ip": public_ip,
            "interfaces": net_info["interfaces"]
        },
        "uptime": uptime_info,
        "agent_version": AGENT_VERSION,
        "collected_at": datetime.now(timezone.utc).isoformat()
    }
    return payload


def send_payload(server_url, token, payload, verbose=True):
    """Envia o payload para o endpoint da API REST com suporte a urllib e requests."""
    endpoint = f"{server_url.rstrip('/')}/api/agent/report"
    data_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "X-Agent-Token": token,
        "User-Agent": f"InfraAsset-Agent/{AGENT_VERSION}"
    }

    if verbose:
        print(f"[*] Enviando telemetria para: {endpoint}")
        print(f"[*] Hostname: {payload['hostname']} | OS: {payload['os']['name']} {payload['os']['version']}")
        print(f"[*] IP Local: {payload['network']['primary_ip']} | MAC: {payload['network']['primary_mac']}")

    # Tenta usar 'requests' se disponível, senão 'urllib.request' nativo
    try:
        import requests
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            if verbose:
                print(f"[SUCESSO] Inventário registrado com sucesso! Resposta: {resp.text}")
            return True
        else:
            print(f"[ERRO] Servidor retornou código {resp.status_code}: {resp.text}")
            return False
    except ImportError:
        # Fallback para urllib padrão da biblioteca Python
        import urllib.request
        import urllib.error
        try:
            req = urllib.request.Request(endpoint, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.getcode()
                body = response.read().decode('utf-8')
                if verbose:
                    print(f"[SUCESSO] Inventário registrado via urllib! (Status {status}): {body}")
                return True
        except urllib.error.HTTPError as e:
            print(f"[ERRO HTTP] Código {e.code}: {e.read().decode('utf-8')}")
            return False
        except Exception as e:
            print(f"[ERRO CONEXÃO] Falha ao contatar {endpoint}: {e}")
            return False
    except Exception as e:
        print(f"[ERRO] Falha geral no envio: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="InfraAsset IT - Agente de Coleta de Inventário")
    parser.add_argument("--server", default=DEFAULT_SERVER_URL, help="URL da Aplicação Web (Ex: http://192.168.1.10:3000)")
    parser.add_argument("--token", default=DEFAULT_API_TOKEN, help="Token de autenticação do agente")
    parser.add_argument("--company", default=os.environ.get("INVENTORY_CLIENT_COMPANY", ""), help="Empresa cliente vinculada ao ativo no ambiente B2B/MSP")
    parser.add_argument("--quiet", action="store_true", help="Execução silenciosa sem logs no console")
    parser.add_argument("--dump-json", action="store_true", help="Imprime o JSON coletado sem enviar")
    args = parser.parse_args()

    verbose = not args.quiet

    if verbose:
        print("=" * 60)
        print(" InfraAsset IT - Coleta de Ativos e Telemetria")
        print(f" Versão do Agente: {AGENT_VERSION}")
        if args.company:
            print(f" Empresa Cliente: {args.company}")
        print("=" * 60)

    payload = collect_inventory_payload()
    if args.company:
        payload["client_company"] = args.company

    if args.dump_json:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    success = send_payload(args.server, args.token, payload, verbose=verbose)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
