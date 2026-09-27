# Elastic Beanstalk Application
resource "aws_elastic_beanstalk_application" "app" {
  name = var.app_name

  tags = {
    Name = var.app_name
  }
}

# IAM role for EC2 instances
resource "aws_iam_role" "beanstalk_ec2_role" {
  name = "${var.app_name}-beanstalk-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach default Beanstalk policy
resource "aws_iam_role_policy_attachment" "beanstalk_ec2_policy" {
  role       = aws_iam_role.beanstalk_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

# S3 access for the application
resource "aws_iam_role_policy" "beanstalk_s3_access" {
  name = "${var.app_name}-s3-access"
  role = aws_iam_role.beanstalk_ec2_role.id

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

# ECR access
resource "aws_iam_role_policy" "beanstalk_ecr_access" {
  name = "${var.app_name}-ecr-access"
  role = aws_iam_role.beanstalk_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch access
resource "aws_iam_role_policy_attachment" "beanstalk_cloudwatch" {
  role       = aws_iam_role.beanstalk_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance profile
resource "aws_iam_instance_profile" "beanstalk_profile" {
  name = "${var.app_name}-beanstalk-profile"
  role = aws_iam_role.beanstalk_ec2_role.name
}

# Beanstalk Environment
resource "aws_elastic_beanstalk_environment" "env" {
  name                = var.environment_name
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.13.9 running Docker"
  tier                = "WebServer"

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = var.min_instances
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = var.max_instances
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.instance_type
  }

  setting {
    namespace = "aws:autoscaling:trigger"
    name      = "MeasureName"
    value     = "CPUUtilization"
  }

  setting {
    namespace = "aws:autoscaling:trigger"
    name      = "Statistic"
    value     = "Average"
  }

  setting {
    namespace = "aws:autoscaling:trigger"
    name      = "Unit"
    value     = "Percent"
  }

  setting {
    namespace = "aws:autoscaling:trigger"
    name      = "UpperThreshold"
    value     = "70"
  }

  setting {
    namespace = "aws:autoscaling:trigger"
    name      = "LowerThreshold"
    value     = "30"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "LoadBalanced"
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "DeleteOnTerminate"
    value     = "false"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = "production"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DATABASE_URL"
    value     = "postgresql://${var.rds_username}:${var.rds_password}@${var.rds_endpoint}/${var.rds_database}"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "S3_BUCKET"
    value     = var.s3_bucket_name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "COGNITO_USER_POOL"
    value     = var.cognito_user_pool_id
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "COGNITO_CLIENT_ID"
    value     = var.cognito_client_id
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.aws_region
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.beanstalk_profile.name
  }

  depends_on = [
    aws_iam_instance_profile.beanstalk_profile
  ]

  tags = {
    Name = var.app_name
  }
}