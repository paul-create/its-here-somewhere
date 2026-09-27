output "beanstalk_endpoint" {
  description = "Beanstalk environment endpoint"
  value       = aws_elastic_beanstalk_environment.env.endpoint_url
}

output "beanstalk_environment_name" {
  description = "Beanstalk environment name"
  value       = aws_elastic_beanstalk_environment.env.name
}

output "beanstalk_application_name" {
  description = "Beanstalk application name"
  value       = aws_elastic_beanstalk_app.app.name
}