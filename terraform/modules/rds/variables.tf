variable "db_name" {
  description = "Database name"
  default     = "its_here_somewhere"
}

variable "db_username" {
  description = "Master username"
  default     = "postgres"
}

variable "db_password" {
  description = "Master password"
  sensitive   = true
  default     = "ChangeMe123!"
}