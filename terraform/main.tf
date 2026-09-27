terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "its-here-somewhere-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "terraform-locks"
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