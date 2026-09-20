variable "aws_region" {
  description = "AWS region"
  default     = "eu-west-2"
}

variable "db_name" {
  description = "Database name"
  default     = "its_here_somewhere"
}

variable "db_username" {
  description = "Database username"
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  default     = "its-here-somewhere-photos"
}