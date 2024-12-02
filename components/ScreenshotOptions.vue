<template>
  <UAccordion :default-open="true" :items="[{ label: 'Screenshot Options', slot: 'options' }]">
    <template #options>
      <div class="space-y-4 p-4">
        <UFormGroup label="Device Preset" name="devicePreset">
          <USelect
            v-model="formState.devicePresetName"
            :options="DEVICE_PRESETS"
            option-attribute="name"
            placeholder="Select a device or custom size"
            value-attribute="name"
            @update:modelValue="updateViewportFromPreset"
          />
        </UFormGroup>

        <UFormGroup
          v-if="formState.devicePresetName === 'Custom'"
          label="Custom Viewport Size"
          name="viewport"
        >
          <div class="flex gap-4">
            <UInput
              v-model="formState.viewport.width"
              max="3840"
              min="320"
              placeholder="Width"
              type="number"
            >
              <template #leading>W</template>
            </UInput>
            <UInput
              v-model="formState.viewport.height"
              max="2160"
              min="320"
              placeholder="Height"
              type="number"
            >
              <template #leading>H</template>
            </UInput>
          </div>
        </UFormGroup>

        <UFormGroup label="Delay before capture (ms)" name="delay">
          <UInput
            v-model="formState.delay"
            max="10000"
            min="0"
            step="500"
            type="number"
          />
        </UFormGroup>

        <UFormGroup label="Retry Options" name="retry">
          <div class="flex gap-4">
            <UInput
              v-model="formState.retryCount"
              label="Retry Attempts"
              max="5"
              min="0"
              type="number"
            />
            <UInput
              v-model="formState.retryDelay"
              label="Retry Delay (ms)"
              max="10000"
              min="1000"
              step="1000"
              type="number"
            />
          </div>
        </UFormGroup>

        <UFormGroup label="Concurrent screenshots" name="concurrency">
          <URange
            v-model="formState.concurrency"
            :max="5"
            :min="1"
            :step="1"
          />
          <span class="text-sm text-gray-500">
            Processing {{ formState.concurrency }} URLs at once
          </span>
        </UFormGroup>
      </div>
    </template>
  </UAccordion>
</template>

<script lang="ts" setup>
import type { DevicePreset } from '~/types/screenshot'
import { DEVICE_PRESETS } from '~/types/screenshot'

const props = defineProps<{
  formState: {
    devicePresetName: string
    viewport: {
      width: number
      height: number
    }
    delay: number
    concurrency: number
    retryCount: number
    retryDelay: number
  }
}>()

const devicePreset = computed(() =>
  DEVICE_PRESETS.find(preset => preset.name === props.formState.devicePresetName)
)

watch(devicePreset, () => {
  if (devicePreset.value) updateViewportFromPreset(devicePreset.value)
})

function updateViewportFromPreset(preset: DevicePreset | null) {
  if (preset) {
    props.formState.viewport.height = preset.height
    props.formState.viewport.width = preset.width
  }
}
</script>