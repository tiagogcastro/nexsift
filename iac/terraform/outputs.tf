output "content_bucket" {
  value = aws_s3_bucket.content.bucket
}

output "publish_function_name" {
  value = aws_lambda_function.publish.function_name
}

output "publish_function_url" {
  value = aws_lambda_function_url.publish.function_url
}
