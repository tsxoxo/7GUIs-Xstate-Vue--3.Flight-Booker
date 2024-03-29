<script setup lang="ts">
import { toRef } from 'vue'
import { useMachine } from '@xstate/vue'
import { flightMachine } from './flightMachine';
import { createBrowserInspector } from '@statelyai/inspect';

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const { snapshot, send } = useMachine(flightMachine, {
  inspect
})
const errors = toRef(() => snapshot.value.context.errors);
const flightType = toRef(() => snapshot.value.context.flightType);
const startDate = toRef(() => snapshot.value.context.startDate);
const returnDate = toRef(() => snapshot.value.context.returnDate);
</script>

<template>
  <div class="center-children plate-shadow" id="inputs-before-button">
    <div id="radio-buttons">
      <div class="radio-button-wrapper">
        <input @change="(event) => send({ type: 'changeFlightType', value: (event!.target as HTMLInputElement)!.value })"
          type="radio" name="flight-type" id="one-way" value="one-way" :checked="flightType === 'one-way'" />
        <label for="one-way">One Way</label>
      </div>
      <div class="radio-button-wrapper">
        <input @change="(event) => send({ type: 'changeFlightType', value: (event!.target as HTMLInputElement)!.value })"
          type="radio" name="flight-type" id="return" value="return" :checked="flightType === 'return'" />
        <label for="return">Return</label>
      </div>
    </div>
    <div class="input-wrapper">
      <input aria-label="start date" :class="{ 'invalid-date-input': errors.has('changeStartDate-invalid') }"
        @input="(event) => send({ type: 'changeStartDate', value: (event!.target as HTMLInputElement)!.value })"
        :value="startDate" type="text" id="start-date" required minlength="6" maxlength="10" size="10" />
      <span :class="{ 'show': errors.has('dates-incompatible') }" class="date-conflict-indicator">▼</span>
    </div>
    <div class="input-wrapper">
      <input aria-label="return date" :disabled="flightType !== 'return'"
        :class="{ 'invalid-date-input': flightType === 'return' && errors.has('changeReturnDate-invalid') }"
        @input="(event) => send({ type: 'changeReturnDate', value: (event!.target as HTMLInputElement)!.value })"
        :value="returnDate" type="text" id="return-date" required minlength="6" maxlength="10" size="10" />
      <span :class="{ 'show': errors.has('dates-incompatible') }" class="date-conflict-indicator">▲</span>
    </div>
  </div>
  <div id="button-and-label" class="center-children">
    <div id="button-wrapper">
      <button :disabled="errors.size > 0" @click="send({ type: snapshot.value === 'waitForInput' ? 'book' : 'dismiss' })"
        value="Book flight">
      </button>
    </div>
    <p class="center-children plate-shadow" id="button-label">{{ snapshot.value === 'waitForInput' ? 'Book flight' :
      `Flight booked!
      Press button to reset` }}</p>
  </div>
</template>