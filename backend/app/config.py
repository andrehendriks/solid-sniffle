from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://homelab:homelab_secret@localhost/homelab_benchmark"
    secret_key: str = "change-me-in-production-please"

    # SMB benchmark
    smb_host: Optional[str] = None
    smb_share: Optional[str] = None
    smb_username: Optional[str] = None
    smb_password: Optional[str] = None

    # Kubernetes
    k8s_kubeconfig: Optional[str] = None

    # Network
    iperf3_server: Optional[str] = None

    # NAS benchmark path
    nas_benchmark_path: str = "/benchmark"

    # Alert webhook
    alert_webhook_url: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
