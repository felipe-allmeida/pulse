# Pulse — Hetzner Cloud server (Docker + Portainer) + firewall.
# DNS is a manual step — see infra/README.md's "Point your DNS" section.
#
# `terraform apply` and supplying real credentials are Felipe's manual steps
# (see infra/README.md). This config never embeds a token — the API token
# comes exclusively from the TF_VAR_hcloud_token environment variable at
# apply time, so `terraform init` / `validate` / `fmt` all work with zero
# credentials.

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.68"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_ssh_key" "this" {
  name       = "${var.server_name}-key"
  public_key = var.ssh_public_key
}

# Inbound: SSH (22) for administration, HTTP/HTTPS (80/443) for Caddy's
# reverse proxy + Let's Encrypt. Portainer's 9443 is deliberately NOT opened
# here — see infra/outputs.tf for the SSH-tunnel access model.
resource "hcloud_firewall" "this" {
  name = "${var.server_name}-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "this" {
  name         = var.server_name
  server_type  = var.server_type
  image        = "ubuntu-24.04"
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.this.id]
  firewall_ids = [hcloud_firewall.this.id]

  # Installs Docker Engine + starts Portainer CE. See infra/cloud-init.yaml.
  user_data = file("${path.module}/cloud-init.yaml")

  labels = {
    project    = "pulse"
    managed-by = "terraform"
  }
}
