terraform {
  required_version = ">= 1.5.0"
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

# 1. Encrypted S3 Document Object Storage
resource "aws_s3_bucket" "documents" {
  bucket = "${var.app_name}-${var.environment}-documents"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents_crypto" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Production PostgreSQL RDS Database
resource "aws_db_instance" "postgres" {
  identifier           = "${var.app_name}-${var.environment}-postgres"
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = var.db_instance_class
  allocated_storage    = 100
  max_allocated_storage = 500
  storage_type         = "gp3"
  storage_encrypted    = true
  multi_az             = true
  username             = "omnirag_admin"
  manage_master_user_password = true
  skip_final_snapshot  = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot"
}

# 3. Redis ElastiCache Replication Group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.app_name}-${var.environment}-redis"
  description                   = "Redis cluster for OmniRAG caching, sessions, and Celery broker"
  node_type                     = "cache.r6g.large"
  num_cache_clusters            = 2
  automatic_failover_enabled    = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  port                          = 6379
}

# 4. ECS Fargate Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

