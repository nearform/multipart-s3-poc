import { useRef, useState } from 'react'
import './App.css'

import upload from './upload'

function App() {
  const inputRef = useRef()
  const [uploading, setUploading] = useState()
  const [uploadResult, setUploadResult] = useState()

  async function handleSubmit(e) {
    e.preventDefault()

    const [file] = inputRef.current.files

    if (!file) {
      return
    }

    try {
      setUploading(true)
      setUploadResult(await upload(file))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input disabled={uploading} type="file" ref={inputRef} />
        <button disabled={uploading} type="submit">
          upload
        </button>
        {uploading && <p>uploading...</p>}
        <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
      </form>
    </div>
  )
}

export default App
