'use client'

import { useState, useRef } from 'react'
import { uploadApi } from '@/lib/api/upload.api'

interface Props {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setIsLoading(true)
    try {
      const url = await uploadApi.uploadImage(file)
      onChange(url)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        className="relative h-32 w-full rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-400 transition-colors cursor-pointer overflow-hidden"
      >
        {value ? (
          <img src={value} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <p className="text-xs text-gray-400">کلیک کنید یا بکشید</p>
              </>
            )}
          </div>
        )}

        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}