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
