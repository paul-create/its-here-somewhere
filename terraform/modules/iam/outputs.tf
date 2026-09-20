output "access_key_id" {
  description = "IAM user access key ID"
  value       = aws_iam_access_key.dev.id
}

output "secret_access_key" {
  description = "IAM user secret access key"
  value       = aws_iam_access_key.dev.secret
  sensitive   = true
}

output "user_arn" {
  description = "IAM user ARN"
  value       = aws_iam_user.dev.arn
}