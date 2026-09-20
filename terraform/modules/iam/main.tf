resource "aws_iam_user" "dev" {
  name = "its-here-somewhere-dev"

  tags = {
    Name = "its-here-somewhere-dev"
  }
}

resource "aws_iam_access_key" "dev" {
  user = aws_iam_user.dev.name
}

resource "aws_iam_user_policy_attachment" "rds" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
}

resource "aws_iam_user_policy_attachment" "s3" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_user_policy_attachment" "cognito" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
}

resource "aws_iam_user_policy_attachment" "app_runner" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AWSAppRunnerFullAccess"
}

resource "aws_iam_user_policy_attachment" "ecr" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_user_policy_attachment" "cloudformation" {
  user       = aws_iam_user.dev.name
  policy_arn = "arn:aws:iam::aws:policy/CloudFormationFullAccess"
}