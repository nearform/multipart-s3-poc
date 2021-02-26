# multipart-s3-poc

This repository contains a Proof Of Concept for S3 multipart uploads.

## Demo

https://multipart-s3-poc.herokuapp.com/

> credentials required

## Reference

- [Using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Uploading photos to Amazon S3 from a browser](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-photo-album.html)

## Requirements

- Node.js
- yarn

## Setup

- `cp .env.sample .env`
- populate environment variables (see [Reference](#reference) for setup instructions)
- `yarn`
- `yarn start`

The application will be running on http://localhost:3000

## How it works

- Files are uploaded directly from the browser to S3 using Cognito and temporary IAM credentials
- The S3 bucket is configured to allow access to Cognito users from a configured Identify Pool (no public access)
- The Cognito Identify Pool is configured to allow anonymous access (any user can authenticate to the pool)
- Files larger than 5MB\* are split into "parts" of 5MB each and uploaded sequentially
- S3 keeps track of the parts already uploaded
- If an error occurs (e.g. the network disconnects), the transfer is paused and retried at intervals, until all the parts are uploaded
- Only that part that fails is retried, until it succeeds

\* 5MB is the minimum size for multipart upload in S3
