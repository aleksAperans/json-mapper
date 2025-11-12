import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function useKeyboardShortcuts() {
  const {
    setIsBookmarksOpen,
    setIsSearchOpen,
    setIsFilterOpen,
    setIsShortcutsOpen,
    setViewerMode,
    expandAll,
    collapseAll,
    incrementExpandDepth,
    decrementExpandDepth,
    expandToMaxDepth,
    collapseToMinDepth,
    activeFeature,
    isSearchOpen,
    searchMatchCount,
    currentSearchIndex,
    setCurrentSearchIndex,
  } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Cmd/Ctrl + / - Show keyboard shortcuts (works everywhere, even in input fields)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsShortcutsOpen(true)
        return
      }

      // Don't handle other shortcuts if typing in an input field
      if (isInputField) return

      // Cmd/Ctrl + B - View bookmarks
      if ((e.metaKey || e.ctrlKey) && e.key === 'b' && activeFeature === 'viewer') {
        e.preventDefault()
        setIsBookmarksOpen(true)
        return
      }

      // Cmd/Ctrl + F - Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }

      // Cmd/Ctrl + Shift + F - Open filter
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setIsFilterOpen(true)
        return
      }

      // Cmd/Ctrl + 1 - Switch to Tree view
      if ((e.metaKey || e.ctrlKey) && e.key === '1' && activeFeature === 'viewer') {
        e.preventDefault()
        setViewerMode('tree')
        return
      }

      // Cmd/Ctrl + 2 - Switch to JSON view
      if ((e.metaKey || e.ctrlKey) && e.key === '2' && activeFeature === 'viewer') {
        e.preventDefault()
        setViewerMode('json')
        return
      }

      // Cmd/Ctrl + E - Expand one level (light)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && !e.shiftKey && !e.altKey && activeFeature === 'viewer') {
        e.preventDefault()
        incrementExpandDepth()
        return
      }

      // Cmd/Ctrl + Shift + E - Collapse one level (light)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E' && !e.altKey && activeFeature === 'viewer') {
        e.preventDefault()
        decrementExpandDepth()
        return
      }

      // Cmd/Ctrl + Alt + E - Expand to max depth (full)
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'e' && !e.shiftKey && activeFeature === 'viewer') {
        e.preventDefault()
        expandToMaxDepth()
        return
      }

      // Cmd/Ctrl + Alt + Shift + E - Collapse all (full)
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.shiftKey && e.key === 'E' && activeFeature === 'viewer') {
        e.preventDefault()
        collapseToMinDepth()
        return
      }

      // Cmd/Ctrl + G - Next search result
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey && isSearchOpen && searchMatchCount > 0) {
        e.preventDefault()
        const newIndex = (currentSearchIndex + 1) % searchMatchCount
        setCurrentSearchIndex(newIndex)
        scrollToMatch(newIndex)
        return
      }

      // Cmd/Ctrl + Shift + G - Previous search result
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G' && isSearchOpen && searchMatchCount > 0) {
        e.preventDefault()
        const newIndex = (currentSearchIndex - 1 + searchMatchCount) % searchMatchCount
        setCurrentSearchIndex(newIndex)
        scrollToMatch(newIndex)
        return
      }

      // Escape - Close modals/panels (handled by the modals themselves, but we can also close search/filter)
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false)
        }
      }
    }

    // Helper function to scroll to search match
    const scrollToMatch = (index: number) => {
      setTimeout(() => {
        const allMatches = document.querySelectorAll('[data-search-match]')
        if (allMatches.length > 0 && index < allMatches.length) {
          const targetMatch = allMatches[index] as HTMLElement
          targetMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // Highlight the current match
          targetMatch.style.backgroundColor = '#fbbf24'
          targetMatch.style.outline = '2px solid #f59e0b'
          setTimeout(() => {
            targetMatch.style.backgroundColor = ''
            targetMatch.style.outline = ''
          }, 1000)
        }
      }, 100)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    setIsBookmarksOpen,
    setIsSearchOpen,
    setIsFilterOpen,
    setIsShortcutsOpen,
    setViewerMode,
    expandAll,
    collapseAll,
    activeFeature,
    isSearchOpen,
    searchMatchCount,
    currentSearchIndex,
    setCurrentSearchIndex,
  ])
}
