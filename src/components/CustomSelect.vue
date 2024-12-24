<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true,
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  iconKey: {
    type: String,
    default: 'icon'
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const selectedOption = ref(null)

const normalizedOptions = computed(() => {
  return props.options.map(option => ({
    value: option[props.valueKey],
    label: option[props.labelKey],
    icon: option[props.iconKey]
  }))
})

watch(() => props.modelValue, (newValue) => {
  selectedOption.value = normalizedOptions.value.find(option => option.value === newValue)
}, { immediate: true })

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const selectOption = (option) => {
  selectedOption.value = option
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

// 点击外部关闭下拉框
const closeDropdown = (e) => {
  if (!e.target.closest('.custom-select')) {
    isOpen.value = false
  }
}

// 监听全局点击
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="custom-select" :class="{ 'is-disabled': disabled }">
    <div 
      class="select-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <div class="selected-option" v-if="selectedOption">
        <span class="material-icons" v-if="selectedOption.icon">
          {{ selectedOption.icon }}
        </span>
        <span class="option-label">{{ selectedOption.label }}</span>
      </div>
      <div class="placeholder" v-else>
        {{ placeholder }}
      </div>
      <span class="material-icons arrow" :class="{ 'is-open': isOpen }">
        expand_more
      </span>
    </div>

    <transition name="dropdown">
        <div class="select-dropdown" v-if="isOpen">
        <div 
            v-for="option in normalizedOptions" 
            :key="option.value"
            class="option-item"
            :class="{ 'is-selected': option.value === modelValue }"
            @click="selectOption(option)"
        >
            <span class="material-icons" v-if="option.icon">
            {{ option.icon }}
            </span>
            <span class="option-label">{{ option.label }}</span>
        </div>
        </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 200px;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--secondary-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-trigger:hover:not(.is-disabled) {
  border-color: var(--accent-color);
  background: var(--accent-dark);
}

.select-trigger.is-open {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.selected-option,
.placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.placeholder {
  color: var(--text-secondary);
}

.arrow {
  color: var(--accent-color);
  transition: transform 0.3s ease;
}

.arrow.is-open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: var(--secondary-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  z-index: 1000;
  overflow: hidden;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: var(--accent-dark);
}

.option-item.is-selected {
  background: var(--accent-color);
  color: white;
}

.option-item .material-icons {
  font-size: 20px;
}

/* 禁用状态 */
.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.is-disabled .select-trigger {
  cursor: not-allowed;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>