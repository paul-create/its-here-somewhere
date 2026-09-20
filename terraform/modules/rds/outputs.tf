output "db_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "RDS address only (for .env)"
  value       = aws_db_instance.postgres.address
}