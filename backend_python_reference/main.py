"""
==============================================================================
INFRAASSET IT - API REST BACKEND EM PYTHON (FASTAPI + SQLALCHEMY + SQLITE)
==============================================================================
Para rodar este backend separadamente em Python:
  pip install fastapi uvicorn sqlalchemy pydantic
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
==============================================================================
"""

from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import sqlite3
import json

app = FastAPI(
    title="InfraAsset IT API",
    description="API de Gerenciamento de Ativos e Coleta de Inventário",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_SECRET_TOKEN = "infra_asset_token_secret_2026"

# Modelos Pydantic para validação do payload do Agente
class DiskPayload(BaseModel):
    device: str
    mountpoint: Optional[str] = ""
    fstype: Optional[str] = "NTFS"
    total_gb: float
    used_gb: float
    free_gb: float
    percent: float

class NetworkInterfacePayload(BaseModel):
    interface_name: str
    ip_address: Optional[str] = None
    netmask: Optional[str] = None
    mac_address: Optional[str] = None
    is_up: Optional[bool] = True

class AgentReportPayload(BaseModel):
    id: str
    hostname: str
    logged_user: Optional[str] = "Desconhecido"
    machine_type: Optional[str] = "desktop"
    os: dict
    cpu: dict
    memory: dict
    disks: List[DiskPayload]
    network: dict
    uptime: dict
    agent_version: Optional[str] = "2.4.0"
    collected_at: Optional[str] = None

class MachineManualUpdate(BaseModel):
    sector: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    asset_tag: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_end: Optional[str] = None
    vendor: Optional[str] = None
    cost: Optional[float] = None
    responsible_person: Optional[str] = None
    notes: Optional[str] = None


def get_db():
    conn = sqlite3.connect("inventory.sqlite", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@app.post("/api/agent/report", status_code=status.HTTP_201_CREATED)
def receive_agent_report(payload: AgentReportPayload, x_agent_token: Optional[str] = Header(None)):
    """Recebe o JSON de telemetria emitido pelo agente nas máquinas."""
    if x_agent_token != AGENT_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Token do Agente inválido ou não informado.")

    conn = get_db()
    cursor = conn.cursor()

    now_iso = datetime.utcnow().isoformat()
    
    # 1. Upsert da Máquina
    cursor.execute("""
        INSERT INTO machines (
            id, hostname, logged_user, machine_type, os_name, os_version, os_build, os_arch,
            cpu_model, cpu_cores_physical, cpu_cores_logical, cpu_freq_ghz, cpu_usage_percent,
            ram_total_gb, ram_used_gb, ram_free_gb, ram_percent,
            primary_ip, public_ip, primary_mac, uptime_seconds, boot_time,
            agent_version, last_seen, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            hostname=excluded.hostname,
            logged_user=excluded.logged_user,
            machine_type=excluded.machine_type,
            os_name=excluded.os_name,
            os_version=excluded.os_version,
            os_build=excluded.os_build,
            cpu_model=excluded.cpu_model,
            cpu_usage_percent=excluded.cpu_usage_percent,
            ram_total_gb=excluded.ram_total_gb,
            ram_used_gb=excluded.ram_used_gb,
            ram_free_gb=excluded.ram_free_gb,
            ram_percent=excluded.ram_percent,
            primary_ip=excluded.primary_ip,
            public_ip=excluded.public_ip,
            uptime_seconds=excluded.uptime_seconds,
            last_seen=excluded.last_seen,
            updated_at=excluded.updated_at
    """, (
        payload.id, payload.hostname, payload.logged_user, payload.machine_type,
        payload.os.get("name", "Windows"), payload.os.get("version", ""), payload.os.get("build", ""), payload.os.get("arch", ""),
        payload.cpu.get("model", ""), payload.cpu.get("cores_physical", 1), payload.cpu.get("cores_logical", 1),
        payload.cpu.get("freq_ghz", 2.4), payload.cpu.get("usage_percent", 0),
        payload.memory.get("total_gb", 0), payload.memory.get("used_gb", 0), payload.memory.get("free_gb", 0), payload.memory.get("percent", 0),
        payload.network.get("primary_ip", ""), payload.network.get("public_ip", ""), payload.network.get("primary_mac", ""),
        payload.uptime.get("seconds", 0), payload.uptime.get("boot_time", ""),
        payload.agent_version, now_iso, now_iso
    ))

    # 2. Atualizar Discos
    cursor.execute("DELETE FROM machine_disks WHERE machine_id = ?", (payload.id,))
    for disk in payload.disks:
        disk_id = f"{payload.id}_{disk.device}"
        cursor.execute("""
            INSERT INTO machine_disks (id, machine_id, device, mountpoint, fstype, total_gb, used_gb, free_gb, percent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (disk_id, payload.id, disk.device, disk.mountpoint, disk.fstype, disk.total_gb, disk.used_gb, disk.free_gb, disk.percent))

    # 3. Registrar Histórico
    cursor.execute("""
        INSERT INTO inventory_history (id, machine_id, cpu_percent, ram_percent, uptime_seconds, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (f"{payload.id}_{int(datetime.utcnow().timestamp())}", payload.id, payload.cpu.get("usage_percent", 0), payload.memory.get("percent", 0), payload.uptime.get("seconds", 0), now_iso))

    conn.commit()
    conn.close()

    return {"status": "success", "message": "Inventário atualizado com sucesso", "machine_id": payload.id}


@app.get("/api/machines")
def list_machines():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines ORDER BY last_seen DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"data": rows, "total": len(rows)}


@app.get("/api/machines/{machine_id}")
def get_machine_details(machine_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines WHERE id = ?", (machine_id,))
    machine = cursor.fetchone()
    if not machine:
        conn.close()
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    cursor.execute("SELECT * FROM machine_disks WHERE machine_id = ?", (machine_id,))
    disks = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM machine_networks WHERE machine_id = ?", (machine_id,))
    networks = [dict(r) for r in cursor.fetchall()]

    conn.close()
    result = dict(machine)
    result["disks"] = disks
    result["networks"] = networks
    return result


@app.patch("/api/machines/{machine_id}")
def update_machine_manual_info(machine_id: str, update_data: MachineManualUpdate):
    conn = get_db()
    cursor = conn.cursor()
    
    fields = []
    values = []
    for k, v in update_data.dict(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if not fields:
        conn.close()
        return {"status": "no_change"}

    values.append(machine_id)
    query = f"UPDATE machines SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    cursor.execute(query, tuple(values))
    conn.commit()
    conn.close()

    return {"status": "success", "message": "Informações manuais atualizadas"}
