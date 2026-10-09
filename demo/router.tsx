import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { Box, Flex } from '@chakra-ui/react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { GetStarted } from './components/GetStarted'
import { Examples } from './components/Examples'
import { ApiReference } from './components/ApiReference'
import { Playground } from './components/Playground'

// ─── Search params type ──────────────────────────────────────────────────────

type SectionSearch = { section?: string }

// ─── Root layout ─────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <Box minH="100vh">
      <Header />
      <Flex>
        <Sidebar />
        <Box flex="1" minW={0}>
          <Outlet />
          <Footer />
        </Box>
      </Flex>
    </Box>
  ),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <>
      <Hero />
      <Features />
    </>
  ),
})

const getStartedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/get-started',
  beforeLoad: () => {
    throw redirect({
      to: '/get-started/$section',
      params: { section: 'installation' },
    })
  },
})

const getStartedSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/get-started/$section',
  component: () => {
    const { section } = getStartedSectionRoute.useParams()
    return <GetStarted section={section} />
  },
})

const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playground',
  component: Playground,
})

const examplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/examples',
  validateSearch: (search: Record<string, unknown>): SectionSearch => ({
    section: typeof search.section === 'string' ? search.section : undefined,
  }),
  component: () => {
    const { section } = examplesRoute.useSearch()
    return <Examples section={section} />
  },
})

const apiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api',
  beforeLoad: () => {
    throw redirect({
      to: '/api/$section',
      params: { section: 'formbuilder' },
    })
  },
})

const apiSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api/$section',
  component: () => {
    const { section } = apiSectionRoute.useParams()
    return <ApiReference section={section} />
  },
})

// ─── Route tree & router ─────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  homeRoute,
  getStartedRoute,
  getStartedSectionRoute,
  playgroundRoute,
  examplesRoute,
  apiRoute,
  apiSectionRoute,
])

export const router = createRouter({
  routeTree,
})

// Type-safe router declaration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}