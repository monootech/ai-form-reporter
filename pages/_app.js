// FILE: pages/_app.js
import '../styles/globals.css'
import { AnimatePresence } from 'framer-motion'

/**
 * MyApp wraps every page. AnimatePresence enables page transition animations.
 */
export default function MyApp({ Component, pageProps, router }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Component {...pageProps} key={router.asPath} />
    </AnimatePresence>
  )
}
