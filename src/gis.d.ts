// Minimal typings for Google Identity Services (https://accounts.google.com/gsi/client)
interface GsiCredentialResponse { credential: string }
interface GsiButtonOptions { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'; shape?: 'rectangular' | 'pill'; locale?: string; width?: number }
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (opts: { client_id: string; callback: (r: GsiCredentialResponse) => void; auto_select?: boolean; ux_mode?: 'popup' | 'redirect' }) => void
        renderButton: (el: HTMLElement, opts: GsiButtonOptions) => void
        prompt: () => void
        disableAutoSelect: () => void
      }
    }
  }
}
