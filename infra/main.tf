# Pulse — Hetzner Cloud server (Docker + Portainer) + firewall + optional DNS.
#
# `terraform apply` and supplying real credentials are Felipe's manual steps
# (see infra/README.md). This config never embeds a token — both API tokens
# come exclusively from TF_VAR_* environment variables at apply time, so
# `terraform init` / `validate` / `fmt` all work with zero credentials.

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.68"
    }
    hetznerdns = {
      source  = "timohirt/hetznerdns"
      version = "~> 2.2"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# Only used when manage_dns = true; harmless (no calls made) otherwise.
provider "hetznerdns" {
  apitoken = var.hetznerdns_token
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

# Optional Hetzner DNS A record: <domain> (relative to dns_zone_id's zone)
# -> server IPv4. Off by default (manage_dns = false) — Felipe may manage
# DNS elsewhere (e.g. a different registrar/provider).
resource "hetznerdns_record" "this" {
  count = var.manage_dns ? 1 : 0

  zone_id = var.dns_zone_id
  name    = var.domain
  value   = hcloud_server.this.ipv4_address
  type    = "A"
  ttl     = 300
}
