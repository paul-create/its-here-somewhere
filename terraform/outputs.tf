output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.app_runner.ecr_repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = module.app_runner.ecr_repository_name
}

output "app_runner_service_url" {
  description = "App Runner service URL"
  value       = module.app_runner.app_runner_service_url
}