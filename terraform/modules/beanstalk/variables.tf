variable "app_name" {
  description = "Elastic Beanstalk application name"
  type        = string
  default     = "its-here-somewhere"
}

variable "environment_name" {
  description = "Elastic Beanstalk environment name"
  type        = string
  default     = "its-here-somewhere-prod"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "rds_endpoint" {
  description = "RDS database endpoint"
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
  description = "S3 bucket name"
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

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 4
}