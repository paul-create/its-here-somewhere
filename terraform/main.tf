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
  source = "./modules/rds"
}

module "s3" {
  source = "./modules/s3"
}

module "cognito" {
  source = "./modules/cognito"
}