import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDataStore } from '@/store/dataStore'
import saveFile from '@/utils/saveFile'

describe('saveFile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does nothing for non-existent file ID', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    saveFile('nonexistent')
    expect(spy).toHaveBeenCalledWith('File with id nonexistent not found')
    spy.mockRestore()
  })

  it('creates download link for complete file', () => {
    const store = useDataStore()
    const data = new Uint8Array([1, 2, 3, 4, 5])
    const chunk = new Blob([data])

    store.setFileDescription({
      id: 'file-1',
      filename: 'test.bin',
      size: chunk.size,
    })

    store.setReceivedChunks(chunk)

    const createObjectURLSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:fake-url')
    const revokeObjectURLSpy = vi
      .spyOn(window.URL, 'revokeObjectURL')
      .mockImplementation(() => {})

    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement)

    saveFile('file-1')

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')

    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('does not trigger download if file is incomplete', () => {
    const store = useDataStore()

    store.setFileDescription({
      id: 'file-1',
      filename: 'test.bin',
      size: 1000,
    })

    const smallChunk = new Blob([new Uint8Array([1, 2, 3])])
    store.setReceivedChunks(smallChunk)

    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL')

    saveFile('file-1')

    expect(createObjectURLSpy).not.toHaveBeenCalled()
    createObjectURLSpy.mockRestore()
  })
})
