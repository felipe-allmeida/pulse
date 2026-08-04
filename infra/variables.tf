variable "hcloud_token" {
  description = <<-EOT
    Hetzner Cloud API token. NEVER hardcode this or put it in a committed
    .tfvars file — supply it at apply time via the TF_VAR_hcloud_token
    environment variable (e.g. `export TF_VAR_hcloud_token=...`).
  EOT
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = <<-EOT
    SSH public key contents to install on the server (root's authorized_keys
    via Hetzner's hcloud_ssh_key resource). Pass the key material directly,
    e.g. `ssh_public_key = file("~/.ssh/id_ed25519.pub")` in a local
    (gitignored) terraform.tfvars, or via TF_VAR_ssh_public_key.
  EOT
  type        = string
}

variable "server_type" {
  description = "Hetzner Cloud server type (size)."
  type        = string
  default     = "cx22"
}

variable "location" {
  description = "Hetzner Cloud datacenter location (e.g. nbg1, fsn1, hel1, ash, hil)."
  type        = string
  default     = "nbg1"
}

variable "server_name" {
  description = "Name for the Hetzner Cloud server (and prefix for related resource names)."
  type        = string
  default     = "pulse"
}

# --- Optional DNS (off by default — Felipe may manage DNS elsewhere) ---

variable "manage_dns" {
  description = "If true, create a Hetzner DNS A record pointing `domain` at the server's IPv4. Off by default."
  type        = bool
  default     = false
}

variable "dns_zone_id" {
  description = "Hetzner DNS zone ID that owns `domain` (required when manage_dns = true). Find it via the Hetzner DNS console or `hetznerdns_zone` data source."
  type        = string
  default     = ""
}

variable "domain" {
  description = <<-EOT
    Record name to create in the Hetzner DNS zone identified by dns_zone_id
    (required when manage_dns = true). This is the label *relative to the
    zone*, not the full FQDN — e.g. "pulse" to create pulse.example.com in
    the example.com zone, or "@" for the zone apex.
  EOT
  type        = string
  default     = ""
}

variable "hetznerdns_token" {
  description = <<-EOT
    Hetzner DNS API token (separate from the Hetzner Cloud token above; only
    needed when manage_dns = true). NEVER hardcode — supply via
    TF_VAR_hetznerdns_token.
  EOT
  type        = string
  sensitive   = true
  default     = ""
}
