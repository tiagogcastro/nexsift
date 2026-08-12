data "archive_file" "publish" {
  type        = "zip"
  source_file = "${path.module}/../../lambda/dist/publish/index.js"
  output_path = "${path.module}/../../lambda/dist/publish.zip"
}

resource "aws_lambda_function" "publish" {
  function_name    = "${local.name_prefix}-publish"
  role             = aws_iam_role.publish.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.publish.output_path
  source_code_hash = data.archive_file.publish.output_base64sha256
  timeout          = 20
  memory_size      = 256

  environment {
    variables = merge(
      {
        CONTENT_BUCKET = aws_s3_bucket.content.bucket
        PUBLISH_TOKEN  = var.publish_token
      },
      var.lambda_endpoint_url != "" ? { AWS_ENDPOINT_URL = var.lambda_endpoint_url } : {}
    )
  }

  tags = local.common_tags
}

resource "aws_lambda_function_url" "publish" {
  function_name      = aws_lambda_function.publish.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "publish_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.publish.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "publish_invoke" {
  statement_id             = "AllowPublicInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.publish.function_name
  principal                = "*"
  invoked_via_function_url = true
}
