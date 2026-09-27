terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "iam" {
  source = "./modules/iam"
}

module "rds" {
  source      = "./modules/rds"
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

module "s3" {
  source            = "./modules/s3"
  s3_bucket_name    = var.s3_bucket_name
  aws_region        = var.aws_region
}

module "cognito" {
  source = "./modules/cognito"
}

module "app_runner" {
  source = "./modules/app-runner"

  rds_endpoint          = module.rds.db_endpoint
  rds_username          = var.db_username
  rds_password          = var.db_password
  rds_database          = var.db_name
  s3_bucket_name        = module.s3.bucket_name
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_client_id     = module.cognito.client_id
  aws_region            = var.aws_region

  depends_on = [
    module.rds,
    module.s3,
    module.cognito
  ]
}