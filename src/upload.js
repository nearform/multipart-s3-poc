import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'

const region = process.env.REACT_APP_REGION
const bucketName = process.env.REACT_APP_BUCKET
const identityPoolId = process.env.REACT_APP_IDENTITY_POOL_ID

const chunkSizeBytes = 5 * 1024 * 1024

const s3 = new S3Client({
  region: region,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region }),
    identityPoolId,
  }),
})

export default async function upload(file) {
  const totalSizeBytes = file.size
  const key = file.name

  if (totalSizeBytes < chunkSizeBytes) {
    return s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
      })
    )
  }

  const numberOfPartsToUpload = Math.ceil(totalSizeBytes / chunkSizeBytes)

  const createUploadResult = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
    })
  )

  try {
    const parts = []

    for (let partIndex = 0; partIndex < numberOfPartsToUpload; partIndex++) {
      const start = partIndex * chunkSizeBytes
      const end = start + Math.min(chunkSizeBytes, totalSizeBytes - start)

      const body = file.slice(start, end)

      const uploadPartResult = await s3.send(
        new UploadPartCommand({
          PartNumber: partIndex + 1,
          Body: body,
          UploadId: createUploadResult.UploadId,
          Key: key,
          Bucket: bucketName,
        })
      )

      parts.push({
        PartNumber: partIndex + 1,
        ETag: uploadPartResult.ETag,
      })
    }

    return s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: createUploadResult.UploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    )
  } catch (err) {
    return s3.send(
      new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: createUploadResult.UploadId,
      })
    )
  }
}
