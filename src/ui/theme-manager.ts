/**
 * Theme Manager
 * Handles dark/light mode and UI theming
 */
export class ThemeManager {
  private currentTheme: 'light' | 'dark' = 'dark'
  private readonly THEME_KEY = 'dex-theme'
  private readonly THEMES = {
    light: {
      name: 'light',
      displayName: 'Light',
      icon: '☀️'
    },
    dark: {
      name: 'dark',
      displayName: 'Dark',
      icon: '🌙'
    }
  }

  constructor() {
    this.loadTheme()
  }

  initialize(): void {
    this.applyTheme()
    this.setupThemeToggle()
    console.log('✅ Theme Manager initialized')
  }

  private loadTheme(): void {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark'
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.currentTheme = prefersDark ? 'dark' : 'light'
    }
  }

  private applyTheme(): void {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', this.currentTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(this.currentTheme)
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor()
    
    // Save to localStorage
    localStorage.setItem(this.THEME_KEY, this.currentTheme)
  }

  private updateMetaThemeColor(): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    const colors = {
      light: '#ffffff',
      dark: '#1f2937'
    }
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors[this.currentTheme])
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = colors[this.currentTheme]
      document.head.appendChild(meta)
    }
  }

  private setupThemeToggle(): void {
    const themeToggle = document.getElementById('theme-toggle')
    if (!themeToggle) return

    // Update toggle button
    this.updateThemeToggle(themeToggle)
    
    // Add click handler
    themeToggle.addEventListener('click', () => {
      this.toggleTheme()
    })

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.currentTheme = e.matches ? 'dark' : 'light'
        this.applyTheme()
        this.updateThemeToggle(themeToggle)
      }
    })
  }

  private updateThemeToggle(toggle: HTMLElement): void {
    const theme = this.THEMES[this.currentTheme]
    const nextTheme = this.currentTheme === 'light' ? this.THEMES.dark : this.THEMES.light
    
    toggle.innerHTML = `
      <span class="swap-icon">${theme.icon}</span>
      <span class="sr-only">Switch to ${nextTheme.displayName} mode</span>
    `
    
    toggle.setAttribute('aria-label', `Switch to ${nextTheme.displayName} mode`)
    toggle.setAttribute('title', `Switch to ${nextTheme.displayName} mode`)
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.applyTheme()
    
    // Update toggle button
    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle) {
      this.updateThemeToggle(themeToggle)
    }
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme }
    }))
  }

  setTheme(theme: 'light' | 'dark'): void {
    if (theme !== this.currentTheme) {
      this.currentTheme = theme
      this.applyTheme()
      
      // Update toggle button
      const themeToggle = document.getElementById('theme-toggle')
      if (themeToggle) {
        this.updateThemeToggle(themeToggle)
      }
      
      // Dispatch theme change event
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.currentTheme }
      }))
    }
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme
  }

  getThemeInfo() {
    return {
      current: this.THEMES[this.currentTheme],
      available: Object.values(this.THEMES)
    }
  }

  // CSS custom properties for dynamic theming
  setCSSProperty(property: string, value: string): void {
    document.documentElement.style.setProperty(property, value)
  }

  getCSSProperty(property: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(property)
  }

  // Utility methods for theme-aware components
  isDarkMode(): boolean {
    return this.currentTheme === 'dark'
  }

  isLightMode(): boolean {
    return this.currentTheme === 'light'
  }

  // Get theme-appropriate colors
  getThemeColors() {
    const colors = {
      light: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#10b981',
        neutral: '#374151',
        base100: '#ffffff',
        base200: '#f3f4f6',
        base300: '#e5e7eb',
        info: '#0ea5e9',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#9ca3af',
        accent: '#34d399',
        neutral: '#d1d5db',
        base100: '#1f2937',
        base200: '#374151',
        base300: '#4b5563',
        info: '#38bdf8',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171'
      }
    }
    
    return colors[this.currentTheme]
  }

  // Animation preferences
  respectsReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // High contrast mode detection
  prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  // Apply accessibility preferences
  applyAccessibilityPreferences(): void {
    if (this.respectsReducedMotion()) {
      document.documentElement.classList.add('reduce-motion')
    }
    
    if (this.prefersHighContrast()) {
      document.documentElement.classList.add('high-contrast')
    }
  }

  // Theme transition animation
  animateThemeTransition(): void {
    if (this.respectsReducedMotion()) return
    
    document.documentElement.classList.add('theme-transition')
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 300)
  }
}

// CSS for theme transitions (to be added to main.css)
export const themeStyles = `
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.theme-transition * {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.reduce-motion,
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.high-contrast {
  filter: contrast(1.5);
}

.swap-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.btn:hover .swap-icon {
  transform: scale(1.1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Theme-specific scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--b2));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.5);
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid hsl(var(--p));
  outline-offset: 2px;
}

/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  .btn {
    border-width: 2px;
  }
  
  .card {
    border: 1px solid hsl(var(--bc) / 0.2);
  }
}
`