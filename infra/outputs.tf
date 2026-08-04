output "server_ipv4" {
  description = "Public IPv4 address of the Pulse server."
  value       = hcloud_server.this.ipv4_address
}

output "portainer_url" {
  description = <<-EOT
    Portainer is reachable at this URL, but port 9443 is NOT opened by the
    firewall (infra/main.tf's hcloud_firewall only allows 22/80/443) — it is
    intentionally not exposed publicly. Reach it via an SSH tunnel:

      ssh -L 9443:localhost:9443 root@<server_ipv4>

    then open https://localhost:9443 in your browser (self-signed cert on
    first run; Portainer prompts you to set the admin password).
  EOT
  value       = "https://${hcloud_server.this.ipv4_address}:9443"
}

output "dns_record_fqdn" {
  description = "The DNS record created when manage_dns = true (null otherwise)."
  value       = var.manage_dns ? "${var.domain} (zone ${var.dns_zone_id}) -> ${hcloud_server.this.ipv4_address}" : null
}
