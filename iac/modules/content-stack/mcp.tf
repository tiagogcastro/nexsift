data "archive_file" "mcp" {
  type        = "zip"
  source_file = "${path.module}/../../../lambda/dist/mcp/index.js"
  output_path = "${path.module}/../../../lambda/dist/mcp.zip"
}

resource "aws_iam_role" "mcp" {
  name               = "${var.name_prefix}-mcp"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "mcp" {
  statement {
    sid    = "WriteLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "mcp" {
  name   = "${var.name_prefix}-mcp"
  role   = aws_iam_role.mcp.id
  policy = data.aws_iam_policy_document.mcp.json
}

resource "aws_lambda_function" "mcp" {
  function_name    = "${var.name_prefix}-mcp"
  role             = aws_iam_role.mcp.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.mcp.output_path
  source_code_hash = data.archive_file.mcp.output_base64sha256
  timeout          = 20
  memory_size      = 256

  environment {
    variables = merge(
      {
        PUBLISH_API_URL = aws_apigatewayv2_api.publish.api_endpoint
        PUBLISH_TOKEN   = var.publish_token
      },
      var.lambda_endpoint_url != "" ? { AWS_ENDPOINT_URL = var.lambda_endpoint_url } : {}
    )
  }

  tags = local.common_tags
}

resource "aws_lambda_function_url" "mcp" {
  function_name      = aws_lambda_function.mcp.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "mcp_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.mcp.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "mcp_invoke" {
  statement_id             = "AllowPublicInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.mcp.function_name
  principal                = "*"
  invoked_via_function_url = true
}