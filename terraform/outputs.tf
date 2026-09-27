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

output "beanstalk_endpoint" {
  description = "Beanstalk environment endpoint"
  value       = module.beanstalk.beanstalk_endpoint
}

output "beanstalk_environment_name" {
  description = "Beanstalk environment name"
  value       = module.beanstalk.beanstalk_environment_name
}