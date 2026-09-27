variable "rds_endpoint" {
  description = "RDS database endpoint (host:port)"
  type        = string
}

variable "rds_username" {
  description = "RDS database username"
  type        = string
}

variable "rds_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
}

variable "rds_database" {
  description = "RDS database name"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for photos"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "instance_cpu" {
  description = "CPU units for App Runner (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "instance_memory" {
  description = "Memory in MB for App Runner (512, 1024, 2048, 3072, 4096)"
  type        = number
  default     = 512
}

variable "min_instances" {
  description = "Minimum number of App Runner instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of App Runner instances"
  type        = number
  default     = 4
}