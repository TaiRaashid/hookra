import {
  parseColor,
  HStack,
  Input,
  ColorPickerRoot,
  ColorPickerControl,
  ColorPickerTrigger,
  ColorPickerValueSwatch,
  ColorPickerPositioner,
  ColorPickerContent,
  ColorPickerArea,
  ColorPickerAreaBackground,
  ColorPickerAreaThumb,
  ColorPickerSliders,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderTrack,
  ColorPickerChannelSliderThumb,
  ColorPickerInput,
  type ColorPickerValueChangeDetails,
} from '@chakra-ui/react'
import { useController, useFormContext } from 'react-hook-form'
import type { ColorFieldSchema } from '../../types/schema'
import { buildValidationRules } from '../../logic/buildValidationRules'

interface Props {
  field: ColorFieldSchema
  name: string
  readOnly?: boolean
}

export function ColorField({ field, name, readOnly }: Props) {
  const { register, watch } = useFormContext()
  const rules = buildValidationRules(field)
  const currentValue = watch(name) ?? '#000000'
  const isReadOnly = readOnly || field.readOnly
  const variant = field.variant ?? 'native'

  const { field: controllerField } = useController({ name, rules })
    
  if (variant === 'chakra') {
    const colorValue = parseColor(
      typeof currentValue === 'string' && currentValue.trim()
        ? currentValue
        : '#000000',
    )

    const handleValueChange = (details: ColorPickerValueChangeDetails) => {
      controllerField.onChange(details.valueAsString)
    }

    return (
      <ColorPickerRoot
        value={colorValue}
        onValueChange={handleValueChange}
        disabled={field.disabled}
        readOnly={isReadOnly}
      >
        <ColorPickerControl>
          <ColorPickerInput asChild>
            <Input fontFamily="mono" fontSize="sm" />
          </ColorPickerInput>
          <ColorPickerTrigger>
            <ColorPickerValueSwatch />
          </ColorPickerTrigger>
        </ColorPickerControl>
        <ColorPickerPositioner>
          <ColorPickerContent>
            <ColorPickerArea>
              <ColorPickerAreaBackground />
              <ColorPickerAreaThumb />
            </ColorPickerArea>
            <ColorPickerSliders>
              <ColorPickerChannelSlider channel="hue">
                <ColorPickerChannelSliderTrack />
                <ColorPickerChannelSliderThumb />
              </ColorPickerChannelSlider>
              <ColorPickerChannelSlider channel="alpha">
                <ColorPickerChannelSliderTrack />
                <ColorPickerChannelSliderThumb />
              </ColorPickerChannelSlider>
            </ColorPickerSliders>
          </ColorPickerContent>
        </ColorPickerPositioner>
      </ColorPickerRoot>
    )
  }

  // Native variant (default) — compact browser swatch + hex label
  return (
    <HStack gap="3">
      <input
        type="color"
        style={{
          width: '40px',
          height: '40px',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid var(--chakra-colors-border)',
          cursor: field.disabled ? 'not-allowed' : isReadOnly ? 'default' : 'pointer',
          pointerEvents: isReadOnly ? 'none' : undefined,
          background: 'transparent',
        }}
        disabled={field.disabled}
        {...register(name, rules)}
      />
      <Input
        value={currentValue}
        readOnly
        disabled={field.disabled}
        w="120px"
        fontFamily="mono"
        fontSize="sm"
      />
    </HStack>
  )
}
