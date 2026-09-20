variable "aws_region" {
  description = "AWS region"
  default     = "eu-west-2"
}

variable "db_name" {
  description = "Database name"
  default     = "its_here_somewhere"
}

variable "s3_bucket_suffix" {
  description = "S3 bucket suffix for uniqueness"
  default     = "dev"
}