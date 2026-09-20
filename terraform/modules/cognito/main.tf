resource "aws_cognito_user_pool" "main" {
  name = "its-here-somewhere-user-pool"

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  auto_verified_attributes = ["email"]

  tags = {
    Name = "its-here-somewhere-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name                = "its-here-somewhere"
  user_pool_id        = aws_cognito_user_pool.main.id
  
  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  generate_secret = false

  depends_on = [aws_cognito_user_pool.main]
}