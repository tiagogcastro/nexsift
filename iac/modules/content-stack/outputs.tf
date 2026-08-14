output "content_bucket" {
  value = aws_s3_bucket.content.bucket
}

output "publish_function_name" {
  value = aws_lambda_function.publish.function_name
}

output "publish_function_url" {
  value = aws_lambda_function_url.publish.function_url
}

output "publish_api_url" {
  value = aws_apigatewayv2_api.publish.api_endpoint
}

output "mcp_function_url" {
  value = aws_lambda_function_url.mcp.function_url
}

output "vercel_reader_access_key_id" {
  value     = one(aws_iam_access_key.vercel_reader[*].id)
  sensitive = true
}

output "vercel_reader_secret_access_key" {
  value     = one(aws_iam_access_key.vercel_reader[*].secret)
  sensitive = true
}
