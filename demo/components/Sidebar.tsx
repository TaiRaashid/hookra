import { Box, Text, VStack, Badge } from '@chakra-ui/react'
import { useColorMode } from '../color-mode'
import { Link, useRouterState } from '@tanstack/react-router'
import { exampleCategories } from '../data/examples'
import { currentVersion } from '../data/versions'

interface NavItem {
  id: string
  to: string
  params?: Record<string, string>
  search?: Record<string, string>
  hash?: string
  label: string
  isNew?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const staticNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { id: 'home', to: '/', label: 'Introduction' },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      {
        id: 'installation',
        to: '/get-started/$section',
        params: { section: 'installation' },
        label: 'Installation',
      },
      {
        id: 'quick-start',
        to: '/get-started/$section',
        params: { section: 'quick-start' },
        label: 'Quick Start',
      },
      {
        id: 'basic-schema',
        to: '/get-started/$section',
        params: { section: 'basic-schema' },
        label: 'Basic Schema',
      },
      {
        id: 'layout',
        to: '/get-started/$section',
        params: { section: 'layout' },
        label: 'Layout & Columns',
      },
      {
        id: 'conditions',
        to: '/get-started/$section',
        params: { section: 'conditions' },
        label: 'Conditional Fields',
      },
      {
        id: 'custom',
        to: '/get-started/$section',
        params: { section: 'custom' },
        label: 'Custom Components',
      },
    ],
  },
  {
    title: 'Playground',
    items: [
      {
        id: 'playground',
        to: '/playground',
        label: 'Interactive Playground',
        isNew: true,
      },
    ],
  },
]

const exampleNavGroups: NavGroup[] = exampleCategories.map((cat) => ({
  title: `Examples: ${cat.title}`,
  items: cat.examples.map((ex) => ({
    id: `ex-${ex.id}`,
    to: '/examples',
    search: { section: ex.id },
    label: ex.title,
  })),
}))

const apiNavigation: NavGroup = {
  title: 'API Reference',
  items: [
    {
      id: 'api-formbuilder',
      to: '/api/$section',
      params: { section: 'formbuilder' },
      label: 'FormBuilder',
    },
    {
      id: 'api-schema',
      to: '/api/$section',
      params: { section: 'schema' },
      label: 'FormSchema',
    },
    {
      id: 'api-fields',
      to: '/api/$section',
      params: { section: 'fields' },
      label: 'Field Types',
    },
    {
      id: 'api-conditions',
      to: '/api/$section',
      params: { section: 'conditions' },
      label: 'Conditions',
    },
    {
      id: 'api-validation',
      to: '/api/$section',
      params: { section: 'validation' },
      label: 'Validation',
    },
    {
      id: 'api-registry',
      to: '/api/$section',
      params: { section: 'registry' },
      label: 'Registry',
    },
    {
      id: 'api-fillfrom',
      to: '/api/$section',
      params: { section: 'fillfrom' },
      label: 'fillFrom & onFill',
      isNew: true,
    },
  ],
}

const navigation: NavGroup[] = [
  ...staticNavigation,
  {
    title: 'Examples',
    items: [
      { id: 'ex-all', to: '/examples', label: 'All Examples' },
    ],
  },
  ...exampleNavGroups,
  apiNavigation,
]

export function Sidebar() {
  const { colorMode } = useColorMode()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const currentSection = (
    routerState.location.search as Record<string, string>
  ).section
  const currentHash = routerState.location.hash

  const bg = colorMode === 'dark' ? 'gray.800' : 'white'
  const borderColor = colorMode === 'dark' ? 'gray.700' : 'gray.200'
  const groupColor = colorMode === 'dark' ? 'gray.400' : 'gray.500'
  const itemColor = colorMode === 'dark' ? 'gray.300' : 'gray.700'
  const activeItemColor = colorMode === 'dark' ? 'brand.300' : 'brand.600'
  const activeItemBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'brand.50'
  const hoverBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.100'

  return (
    <Box
      as="nav"
      position="sticky"
      top="64px"
      h="calc(100vh - 64px)"
      w="260px"
      flexShrink={0}
      overflowY="auto"
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      py="6"
      px="4"
      display={{ base: 'none', lg: 'block' }}
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--chakra-colors-gray-300)',
          borderRadius: '4px',
        },
      }}
    >
      <VStack gap="6" align="stretch">
        <Box px="3" pb="2" borderBottom="1px solid" borderColor={borderColor}>
          <Text fontSize="xs" color={groupColor} fontFamily="mono">
            v{currentVersion.version}
          </Text>
        </Box>

        {navigation.map((group) => (
          <Box key={group.title}>
            <Text
              fontSize="xs"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="wider"
              color={groupColor}
              px="3"
              mb="2"
            >
              {group.title}
            </Text>

            <VStack gap="0.5" align="stretch">
              {group.items.map((item) => {
                const resolvedPath = item.params
                  ? Object.entries(item.params).reduce(
                      (path, [key, val]) =>
                        path.replace(`$${key}`, val),
                      item.to,
                    )
                  : item.to

                const isActive =
                  currentPath === resolvedPath &&
                  (item.hash
                    ? currentHash === item.hash
                    : item.search?.section
                      ? currentSection === item.search.section
                      : !currentSection && !currentHash)

                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    params={item.params}
                    search={item.search}
                    hash={item.hash}
                    style={{ textDecoration: 'none' }}
                  >
                    <Box
                      textAlign="left"
                      px="3"
                      py="1.5"
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight={isActive ? '600' : '400'}
                      color={isActive ? activeItemColor : itemColor}
                      bg={isActive ? activeItemBg : 'transparent'}
                      _hover={{ bg: isActive ? activeItemBg : hoverBg }}
                      transition="all 0.15s"
                      display="flex"
                      alignItems="center"
                      gap="2"
                      w="100%"
                    >
                      {item.label}

                      {item.isNew && (
                        <Badge
                          colorPalette="green"
                          fontSize="2xs"
                          variant="subtle"
                        >
                          New
                        </Badge>
                      )}
                    </Box>
                  </Link>
                )
              })}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}