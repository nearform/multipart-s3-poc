import { useEffect, useRef, useState } from 'react'
import events from 'events'

import './App.css'

import { listParts, listUploads, upload } from './multipart'
import Progress from './Progress'

function App() {
  const inputRef = useRef()
  const [progress, setProgress] = useState()
  const [status, setStatus] = useState()
  const [uploadResult, setUploadResult] = useState()

  useEffect(() => {
    async function run() {
      const uploads = await listUploads()
      console.log(uploads)

      for (const upload of uploads.Uploads) {
        const parts = await listParts(upload)

        console.log(parts)
      }
    }

    run()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    const [file] = inputRef.current.files

    if (!file) {
      return
    }

    const emitter = new events.EventEmitter()

    emitter.addListener('progress', setProgress)
    emitter.addListener('pause', () => setStatus('pause'))
    emitter.addListener('resume', () => setStatus('resume'))

    try {
      setStatus('running')
      setProgress(0)
      setUploadResult()
      setUploadResult(await upload(file, emitter))
      setProgress(1)
      setStatus('completed')
    } finally {
      setStatus('error')
    }
  }

  const uploading = status && !['error', 'completed'].includes(status)

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input disabled={uploading} type="file" ref={inputRef} />
        <button disabled={uploading} type="submit">
          upload
        </button>
        <hr />
        <Progress value={progress} />
        <p>Status: {status}</p>
        <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
      </form>
    </div>
  )
}

export default App
