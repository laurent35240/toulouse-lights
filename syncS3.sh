#!/bin/bash
~/.local/bin/aws s3 sync --delete --exclude ".*" .  s3://toulouse-lights

