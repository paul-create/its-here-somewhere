# ECR Repository for Docker images
resource "aws_ecr_repository" "app" {
  name                 = "its-here-somewhere"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "its-here-somewhere"
  }
}

# Lifecycle rule to keep last 5 images
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# IAM Role for App Runner
resource "aws_iam_role" "app_runner" {
  name = "its-here-somewhere-app-runner-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "its-here-somewhere-app-runner-role"
  }
}

# Policy for ECR access
resource "aws_iam_role_policy" "app_runner_ecr" {
  name = "its-here-somewhere-app-runner-ecr"
  role = aws_iam_role.app_runner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage"
        ]
        Resource = "${aws_ecr_repository.app.arn}*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for S3 access
resource "aws_iam_role_policy" "app_runner_s3" {
  name = "its-here-somewhere-app-runner-s3"
  role = aws_iam_role.app_runner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

# Security group for App Runner
resource "aws_security_group" "app_runner" {
  name        = "its-here-somewhere-app-runner-sg"
  description = "Security group for App Runner service"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "its-here-somewhere-app-runner-sg"
  }
}

# App Runner Service
resource "aws_apprunner_service" "app" {
  service_name = "its-here-somewhere"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.app.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV           = "production"
          DATABASE_URL       = "postgresql://${var.rds_username}:${var.rds_password}@${var.rds_endpoint}/${var.rds_database}"
          S3_BUCKET          = var.s3_bucket_name
          COGNITO_USER_POOL  = var.cognito_user_pool_id
          COGNITO_CLIENT_ID  = var.cognito_client_id
          AWS_REGION         = var.aws_region
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.instance_cpu
    memory            = var.instance_memory
    instance_role_arn = aws_iam_role.app_runner.arn
  }

  tags = {
    Name = "its-here-somewhere"
  }
}

# Data sources for VPC and subnets
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}