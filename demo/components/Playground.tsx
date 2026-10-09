import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { FormBuilder, type FormSchema } from 'hookra'
import { allExamples, type ExampleDef } from '../data/examples'
import { useColorMode } from '../color-mode'
import { CodeBlock } from './CodeBlock'

const starterSchema: FormSchema = {
  title: 'Interactive Form',
  description: 'Edit the schema on the left and see the form update live.',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      placeholder: 'Write something...',
    },
  ],
  submitLabel: 'Submit',
  showReset: true,
}

function isJsonSerializable(value: unknown): boolean {
  if (value === null) return true

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSerializable)
  }

  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Object.prototype && prototype !== null) {
      return false
    }

    return Object.values(value as Record<string, unknown>).every(
      isJsonSerializable,
    )
  }

  return false
}

const playgroundExamples: ExampleDef[] = allExamples.filter((example) =>
  isJsonSerializable(example.schema),
)

const initialExample = playgroundExamples[0]
const initialSchema = initialExample?.schema ?? starterSchema

export function Playground() {
  const { colorMode } = useColorMode()

  const [selectedExampleId, setSelectedExampleId] = useState(
    initialExample?.id ?? 'starter',
  )
  const [schema, setSchema] = useState<FormSchema>(initialSchema)
  const [schemaText, setSchemaText] = useState(() =>
    JSON.stringify(initialSchema, null, 2),
  )
  const [parseError, setParseError] = useState<string | null>(null)
  const [submittedData, setSubmittedData] =
    useState<Record<string, unknown> | null>(null)

  const editorBg = colorMode === 'dark' ? 'gray.900' : 'gray.50'
  const panelBg = colorMode === 'dark' ? 'gray.800' : 'white'
  const borderColor = colorMode === 'dark' ? 'gray.700' : 'gray.200'
  const mutedColor = colorMode === 'dark' ? 'gray.400' : 'gray.600'

  const formattedSchema = useMemo(
    () => JSON.stringify(schema, null, 2),
    [schema],
  )

  const handleSchemaChange = (value: string) => {
    setSchemaText(value)

    try {
      const parsed: unknown = JSON.parse(value)

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        throw new Error('Schema must be a JSON object.')
      }

      const parsedSchema = parsed as FormSchema

      if (
        !Array.isArray(parsedSchema.fields) &&
        !Array.isArray(parsedSchema.sections)
      ) {
        throw new Error(
          'Schema must contain either "fields" or "sections".',
        )
      }

      setSchema(parsedSchema)
      setParseError(null)
      setSubmittedData(null)
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'Invalid JSON.',
      )
    }
  }

  const handleExampleChange = (exampleId: string) => {
    const example = playgroundExamples.find(
      (item) => item.id === exampleId,
    )

    if (!example) return

    setSelectedExampleId(example.id)
    setSchema(example.schema)
    setSchemaText(JSON.stringify(example.schema, null, 2))
    setParseError(null)
    setSubmittedData(null)
  }

  const handleReset = () => {
    const example = playgroundExamples.find(
      (item) => item.id === selectedExampleId,
    )

    const nextSchema = example?.schema ?? starterSchema

    setSchema(nextSchema)
    setSchemaText(JSON.stringify(nextSchema, null, 2))
    setParseError(null)
    setSubmittedData(null)
  }

  return (
    <Box px={{ base: 4, md: 8 }} py={{ base: 8, md: 10 }}>
      <VStack align="stretch" gap="8">
        <Box>
          <Heading size="2xl" mb="3">
            Interactive Playground
          </Heading>

          <Text color={mutedColor} maxW="800px">
            Experiment with Hookra forms by editing a JSON schema or
            loading an existing example. Valid changes update the
            preview immediately.
          </Text>
        </Box>

        <Flex
          direction={{ base: 'column', xl: 'row' }}
          gap="6"
          align="stretch"
        >
          <Box
            flex="1"
            minW={0}
            bg={editorBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            overflow="hidden"
          >
            <Flex
              justify="space-between"
              align={{ base: 'stretch', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap="3"
              px="4"
              py="3"
              borderBottom="1px solid"
              borderColor={borderColor}
            >
              <Text fontWeight="600">Schema Editor</Text>

              <Flex gap="2" align="center" flexWrap="wrap">
                <NativeSelect.Root maxW="220px" size="sm">
  <NativeSelect.Field
    aria-label="Choose an example schema"
    value={selectedExampleId}
    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
      handleExampleChange(event.target.value)
    }
  >
    {!initialExample && <option value="starter">Starter Form</option>}
    {playgroundExamples.map((example) => (
      <option key={example.id} value={example.id}>
        {example.title}
      </option>
    ))}
  </NativeSelect.Field>
</NativeSelect.Root>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Flex>
            </Flex>

            {playgroundExamples.find(
              (example) => example.id === selectedExampleId,
            )?.description && (
              <Box px="4" pt="3">
                <Text fontSize="sm" color={mutedColor}>
                  {
                    playgroundExamples.find(
                      (example) =>
                        example.id === selectedExampleId,
                    )?.description
                  }
                </Text>
              </Box>
            )}

            <Box p="4">
              <Textarea
                aria-label="Form schema JSON editor"
                value={schemaText}
                onChange={(event) =>
                  handleSchemaChange(event.target.value)
                }
                minH="520px"
                resize="vertical"
                fontFamily="mono"
                fontSize="sm"
                lineHeight="1.6"
                bg={colorMode === 'dark' ? 'gray.950' : 'white'}
                borderColor={parseError ? 'red.400' : borderColor}
                spellCheck={false}
              />

              {parseError && (
                <Box
                  mt="3"
                  px="3"
                  py="2"
                  borderRadius="md"
                  bg={colorMode === 'dark' ? 'red.950' : 'red.50'}
                  border="1px solid"
                  borderColor="red.300"
                  role="alert"
                >
                  <Text fontSize="sm" color="red.500">
                    Invalid schema: {parseError}
                  </Text>
                  <Text mt="1" fontSize="xs" color={mutedColor}>
                    The preview continues to show the last valid schema.
                  </Text>
                </Box>
              )}
            </Box>
          </Box>

          <Box
            flex="1"
            minW={0}
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            overflow="hidden"
          >
            <Box
              px="4"
              py="3"
              borderBottom="1px solid"
              borderColor={borderColor}
            >
              <Text fontWeight="600">Live Preview</Text>
              <Text fontSize="sm" color={mutedColor} mt="1">
                {parseError
                  ? 'Showing the last valid schema'
                  : 'Rendered from the current schema'}
              </Text>
            </Box>

            <Box p={{ base: 4, md: 6 }}>
              <FormBuilder
                schema={schema}
                onSubmit={(data) => setSubmittedData(data)}
              />
            </Box>
          </Box>
        </Flex>

        {submittedData !== null && (
          <Box>
            <Heading size="md" mb="3">
              Submitted Data
            </Heading>

            <CodeBlock
              code={JSON.stringify(submittedData, null, 2)}
              language="json"
              filename="form-data.json"
            />
          </Box>
        )}

        <Box>
          <Heading size="md" mb="3">
            Current Schema
          </Heading>

          <Text color={mutedColor} fontSize="sm" mb="3">
            Copy or inspect the schema currently being rendered.
          </Text>

          <CodeBlock
            code={formattedSchema}
            language="json"
            filename="schema.json"
            showLineNumbers
          />
        </Box>
      </VStack>
    </Box>
  )
}